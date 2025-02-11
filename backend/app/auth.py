import dataclasses
import logging
from textwrap import dedent
from typing import Annotated, TypedDict, Optional

import httpx
import jwt
from asyncache import cached
from cachetools import TTLCache
from fastapi import HTTPException, Cookie, Depends
from jwt import PyJWTError, PyJWKClient

from app.settings import settings

logger = logging.getLogger('uvicorn.error')

jwk_client = PyJWKClient(
    uri=settings.jwks_uri,
    lifespan=settings.jwks_ttl
)


class IdTokenPayload(TypedDict):
    # The unique identifier of the user
    sub: str

    # Timestamp when the token will expire
    exp: int

    # User email provided by the "email" scope
    email: Optional[str]

    # Displayable username provided by the "profile" scope
    preferred_username: Optional[str]

    # First name and last name provided by the "profile" scope
    name: Optional[str]


@dataclasses.dataclass
class IdToken:
    token: str
    payload: IdTokenPayload

    @property
    def sub(self) -> str:
        return self.payload["sub"]

    @property
    def username(self) -> str:
        if email := self.payload.get("email"):
            return email
        if preferred_username := self.payload.get("preferred_username"):
            return preferred_username
        if name := self.payload.get("name"):
            return name
        return self.sub


def authenticated_only(
    id_token: Annotated[str | None, Cookie()] = None,
) -> IdToken:
    """
    Marks that the endpoint can only be accessed by authenticated users.

    If user token is missing in headers or cookies,
    or if it's invalid or expired, raises HTTP401 error.

    Returns an IdToken object with the token value and its payload.
    """
    if settings.unsafe_disable_auth:
        return IdToken(token="", payload={
            "sub": "",
            "exp": 0,
            "email": "",
            "preferred_username": "",
            "name": ""
        })

    if not id_token:
        raise HTTPException(status_code=401)

    return decode_token(id_token)


def decode_token(id_token: str) -> IdToken:
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            key=signing_key.key,
            algorithms=[settings.jwks_alg],
            audience=settings.client_id,
        )
        return IdToken(token=id_token, payload=payload)
    except PyJWTError as error:
        logger.error(error)
        raise HTTPException(status_code=401) from error


async def admin_only(
    id_token: Annotated[IdToken, Depends(authenticated_only)],
    access_token: Annotated[str | None, Cookie()] = None
):
    """
    Marks that the endpoint can only be accessed by service administrators.
    A user is considered an administrator if they are a member of the
    configured administrator group (settings.admin_group).

    If user token is missing in headers or cookies or if it's invalid,
    raises HTTP401 error.

    If user is not a member of the configured administrator group,
    raises HTTP403 error.
    """
    if settings.unsafe_disable_auth:
        return

    if not id_token:
        raise HTTPException(status_code=401)

    if not (groups := id_token.payload.get("groups")) and access_token:
        # Groups are missing in the user token.
        # Call the IdP to retrieve groups.
        groups = await get_groups(access_token)

    if not groups:
        logger.warning(
            "IdP did not provide any groups for the specified token."
        )

    if settings.admin_group not in groups:
        raise HTTPException(status_code=403)


@cached(TTLCache(maxsize=64, ttl=settings.userinfo_ttl))
async def get_groups(access_token: str) -> list[str]:
    """
    Gets user groups from the IdP using the specified ID token.
    """
    if not settings.userinfo_endpoint:
        return []

    async with httpx.AsyncClient() as client:
        print(settings.userinfo_endpoint)
        response = await client.get(
            settings.userinfo_endpoint,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        print(response, access_token, response.text)
        if response.is_success:
            data = response.json()
            return data.get("groups", [])
        text = response.text
        www_authenticate = response.headers.get("www-authenticate")
        logger.warning(dedent(f"""
            Failed to retrieve user groups from IdP: {text}
            {www_authenticate}
        """))
        return []
