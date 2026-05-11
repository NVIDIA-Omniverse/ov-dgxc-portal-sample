# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: MIT
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

import asyncio
import logging
import secrets
import time
from typing import Optional
from urllib.parse import urlencode, urlparse

import httpx
import jwt
from jwt import PyJWTError
from mcp.server.auth.provider import (
    AuthorizationCode,
    AuthorizationParams,
    OAuthAuthorizationServerProvider,
    RefreshToken,
    TokenError,
    construct_redirect_uri,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken
from pydantic import AnyUrl, ConfigDict
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse, Response

from app.auth import (
    User,
    get_expected_issuer,
    get_jwk_client,
    get_openid_configuration,
)
from app.mcp.auth import PortalAccessToken
from app.models import (
    McpAccessTokenModel,
    McpAuthCodeModel,
    McpAuthTransactionModel,
    McpOAuthClientModel,
    McpRefreshTokenModel,
    McpUserGrantModel,
)
from app.settings import settings

logger = logging.getLogger(__name__)

AUTH_CODE_TTL = 300
TRANSACTION_TTL = 600
ACCESS_TOKEN_TTL = 60 * 60
REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30
PURGE_INTERVAL = 600

_provider: Optional["PortalOAuthProvider"] = None


def build_provider() -> "PortalOAuthProvider":
    """Creates the broker provider singleton used by the MCP auth routes."""
    global _provider
    if _provider is None:
        _provider = PortalOAuthProvider()
    return _provider


def get_provider() -> Optional["PortalOAuthProvider"]:
    """Returns the broker provider singleton, or None before it is built."""
    return _provider


class _PortalAuthorizationCode(AuthorizationCode):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user: User


class _PortalRefreshToken(RefreshToken):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user: User


class PortalOAuthProvider(
    OAuthAuthorizationServerProvider[
        _PortalAuthorizationCode, _PortalRefreshToken, PortalAccessToken
    ]
):
    """
    OAuth 2.1 authorization server that brokers logins to the portal identity
    provider.

    MCP clients (Cursor, Claude Code) register dynamically, run the
    browser PKCE flow against this server, and receive opaque tokens minted
    here. The server in turn drives a confidential authorization-code exchange
    with the portal identity provider, so clients never depend on the identity
    provider advertising PKCE or dynamic client registration.

    Clients, codes and tokens are persisted with Tortoise so the flow works
    across multiple backend replicas.
    """

    async def get_client(
        self, client_id: str
    ) -> Optional[OAuthClientInformationFull]:
        row = await McpOAuthClientModel.get_or_none(client_id=client_id)
        if row is None:
            return None
        return OAuthClientInformationFull(**row.client_info)

    async def register_client(
        self, client_info: OAuthClientInformationFull
    ) -> None:
        await McpOAuthClientModel.update_or_create(
            client_id=client_info.client_id,
            defaults={"client_info": client_info.model_dump(mode="json")},
        )

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        transaction_id = secrets.token_urlsafe(32)
        await McpAuthTransactionModel.create(
            id=transaction_id,
            client_id=client.client_id,
            redirect_uri=str(params.redirect_uri),
            redirect_uri_provided_explicitly=params.redirect_uri_provided_explicitly,
            code_challenge=params.code_challenge,
            scopes=params.scopes or [],
            client_state=params.state,
            resource=params.resource,
            expires_at=time.time() + TRANSACTION_TTL,
        )

        oidc = get_openid_configuration()
        query = urlencode(
            {
                "response_type": "code",
                "client_id": settings.mcp_upstream_client_id,
                "redirect_uri": mcp_callback_url(),
                "scope": " ".join(settings.mcp_upstream_scopes),
                "state": transaction_id,
            }
        )
        return f"{oidc['authorization_endpoint']}?{query}"

    async def complete_authorization(
        self, transaction_id: str, upstream_code: str
    ) -> str:
        """
        Finalizes a brokered login: exchanges the upstream code, mints a local
        authorization code, and returns the client redirect URL.
        """
        transaction = await McpAuthTransactionModel.get_or_none(id=transaction_id)
        if transaction is not None:
            await transaction.delete()
        if transaction is None or transaction.expires_at < time.time():
            raise TokenError(
                "invalid_grant", "Unknown or expired authorization transaction."
            )

        user = await exchange_upstream_code(upstream_code)

        code = secrets.token_urlsafe(32)
        await McpAuthCodeModel.create(
            code=code,
            client_id=transaction.client_id,
            scopes=transaction.scopes,
            expires_at=time.time() + AUTH_CODE_TTL,
            code_challenge=transaction.code_challenge,
            redirect_uri=transaction.redirect_uri,
            redirect_uri_provided_explicitly=transaction.redirect_uri_provided_explicitly,
            resource=transaction.resource,
            **_user_fields(user),
        )
        return construct_redirect_uri(
            transaction.redirect_uri, code=code, state=transaction.client_state
        )

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: str
    ) -> Optional[_PortalAuthorizationCode]:
        row = await McpAuthCodeModel.get_or_none(code=authorization_code)
        if row is None:
            return None
        return _PortalAuthorizationCode(
            code=row.code,
            scopes=row.scopes,
            expires_at=row.expires_at,
            client_id=row.client_id,
            code_challenge=row.code_challenge,
            redirect_uri=AnyUrl(row.redirect_uri),
            redirect_uri_provided_explicitly=row.redirect_uri_provided_explicitly,
            resource=row.resource,
            subject=row.subject,
            user=_user_from_row(row),
        )

    async def exchange_authorization_code(
        self,
        client: OAuthClientInformationFull,
        authorization_code: _PortalAuthorizationCode,
    ) -> OAuthToken:
        await McpAuthCodeModel.filter(code=authorization_code.code).delete()
        return await self._issue_tokens(
            client.client_id,
            authorization_code.scopes,
            authorization_code.user,
        )

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> Optional[_PortalRefreshToken]:
        row = await McpRefreshTokenModel.get_or_none(token=refresh_token)
        if row is None:
            return None
        return _PortalRefreshToken(
            token=row.token,
            client_id=row.client_id,
            scopes=row.scopes,
            expires_at=int(row.expires_at),
            subject=row.subject,
            user=_user_from_row(row),
        )

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: _PortalRefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        await McpRefreshTokenModel.filter(token=refresh_token.token).delete()
        return await self._issue_tokens(
            client.client_id,
            scopes or refresh_token.scopes,
            refresh_token.user,
        )

    async def load_access_token(
        self, token: str
    ) -> Optional[PortalAccessToken]:
        row = await McpAccessTokenModel.get_or_none(token=token)
        if row is None:
            return None
        if row.expires_at < time.time():
            await row.delete()
            return None
        return PortalAccessToken(
            token=row.token,
            client_id=row.client_id,
            scopes=row.scopes,
            expires_at=int(row.expires_at),
            subject=row.subject,
            user=_user_from_row(row),
        )

    async def revoke_token(self, token) -> None:
        await McpAccessTokenModel.filter(token=token.token).delete()
        await McpRefreshTokenModel.filter(token=token.token).delete()

    async def _issue_tokens(
        self, client_id: str, scopes: list[str], user: User
    ) -> OAuthToken:
        now = int(time.time())
        access = secrets.token_urlsafe(32)
        refresh = secrets.token_urlsafe(32)

        await McpAccessTokenModel.create(
            token=access,
            client_id=client_id,
            scopes=scopes,
            expires_at=now + ACCESS_TOKEN_TTL,
            subject=user.sub,
            **_user_fields(user),
        )
        await McpRefreshTokenModel.create(
            token=refresh,
            client_id=client_id,
            scopes=scopes,
            expires_at=now + REFRESH_TOKEN_TTL,
            subject=user.sub,
            **_user_fields(user),
        )
        return OAuthToken(
            access_token=access,
            expires_in=ACCESS_TOKEN_TTL,
            scope=" ".join(scopes) or None,
            refresh_token=refresh,
        )


async def handle_oauth_callback(request: Request) -> Response:
    """Handles the identity provider redirect back to the MCP broker."""
    provider = get_provider()
    if provider is None:
        return JSONResponse({"error": "server_error"}, status_code=500)

    error = request.query_params.get("error")
    if error:
        description = request.query_params.get("error_description", "")
        return JSONResponse(
            {"error": error, "error_description": description}, status_code=400
        )

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        return JSONResponse(
            {"error": "invalid_request"}, status_code=400
        )

    try:
        redirect_url = await provider.complete_authorization(state, code)
    except TokenError as token_error:
        return JSONResponse(
            {
                "error": token_error.error,
                "error_description": token_error.error_description,
            },
            status_code=400,
        )
    except Exception:
        logger.exception("MCP OAuth callback failed.")
        return JSONResponse({"error": "server_error"}, status_code=400)

    return RedirectResponse(redirect_url, status_code=302)


async def watch_mcp_data_purge():
    """Periodically deletes expired MCP OAuth transactions, codes and tokens."""
    while True:
        deleted = await purge_expired()
        if deleted:
            logger.info("Purged %d expired MCP OAuth record(s).", deleted)
        await asyncio.sleep(PURGE_INTERVAL)


async def purge_expired() -> int:
    now = time.time()
    deleted = 0
    for model in (
        McpAuthTransactionModel,
        McpAuthCodeModel,
        McpAccessTokenModel,
        McpRefreshTokenModel,
    ):
        deleted += await model.filter(expires_at__lt=now).delete()
    return deleted


async def exchange_upstream_code(code: str) -> User:
    oidc = get_openid_configuration()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            oidc["token_endpoint"],
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": mcp_callback_url(),
                "client_id": settings.mcp_upstream_client_id,
                "client_secret": settings.mcp_upstream_client_secret,
            },
        )
    response.raise_for_status()
    tokens = response.json()

    id_token = tokens["id_token"]
    access_token = tokens.get("access_token")
    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            key=signing_key.key,
            algorithms=[settings.jwks_alg],
            audience=settings.mcp_upstream_client_id,
            issuer=get_expected_issuer(),
            options={"require": ["exp", "iss", "aud"]},
        )
    except PyJWTError as error:
        logger.warning("MCP upstream id_token validation failed: %s", error)
        raise TokenError("invalid_grant", "Invalid upstream id_token.")

    return User(id_token=id_token, access_token=access_token, payload=payload)


def mcp_issuer_url() -> str:
    parsed = urlparse(settings.mcp_resource_url)
    return f"{parsed.scheme}://{parsed.netloc}"


def mcp_callback_url() -> str:
    return f"{mcp_issuer_url()}{settings.mcp_callback_path}"


def _user_fields(user: User) -> dict:
    return {
        "user_id_token": user.id_token,
        "user_access_token": user.access_token,
        "user_payload": dict(user.payload),
    }


def _user_from_row(row: McpUserGrantModel) -> User:
    return User(
        id_token=row.user_id_token,
        access_token=row.user_access_token,
        payload=row.user_payload,
    )
