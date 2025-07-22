import dataclasses
import logging
from textwrap import dedent
from typing import Annotated, TypedDict, Optional

import httpx
import jwt
from asyncache import cached
from cachetools import TTLCache
from fastapi import HTTPException, Cookie, Depends, Header
from jwt import PyJWTError, PyJWKClient

from app.api_keys import api_keys, ApiKey
from app.settings import settings

logger = logging.getLogger("uvicorn.error")


class OpenIdConfig(TypedDict):
    jwks_uri: str
    token_endpoint: str
    userinfo_endpoint: str


_oidc_config: OpenIdConfig | None = None
_jwk_client: PyJWKClient | None = None


def get_openid_configuration() -> OpenIdConfig:
    global _oidc_config
    if _oidc_config is None:
        _oidc_config = httpx.get(settings.metadata_uri).json()
    return OpenIdConfig(**_oidc_config)


def get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        oidc_config = get_openid_configuration()
        _jwk_client = PyJWKClient(
            uri=oidc_config["jwks_uri"],
            lifespan=settings.jwks_ttl
        )
    return _jwk_client


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
class User:
    id_token: str
    payload: IdTokenPayload
    access_token: Optional[str] = None

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

    @property
    def is_api_key_user(self) -> bool:
        return self.sub.startswith("api_key:")

    async def is_admin(self) -> bool:
        if self.is_api_key_user:
            return True

        if (
            not (groups := self.payload.get(settings.groups_claim))
            and self.access_token
        ):
            # Groups are missing in the id token.
            # Call the IdP to retrieve groups.
            groups = self.payload[settings.groups_claim] = await get_groups(
                self.access_token
            )

        if not groups:
            logger.warning(
                "IdP did not provide any groups for the specified token."
            )
        return bool(groups and settings.admin_group in groups)


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    match authorization.split(" ", 1):
        case ["Bearer", token]:
            return token
        case _:
            return None


def create_api_key_user(api_key_obj: ApiKey) -> User:
    """Create a User object for API key authentication."""
    return User(
        id_token="",
        access_token="",
        payload={
            "sub": f"api_key:{api_key_obj.name}",
            "exp": 0,
            "email": f"{api_key_obj.name}@api.system",
            "preferred_username": f"api_key_{api_key_obj.name}",
            "name": f"API Key ({api_key_obj.name})",
        },
    )


def authenticated_only(
    authorization: Annotated[str | None, Header(include_in_schema=False)] = None,
    id_token: Annotated[str | None, Cookie(include_in_schema=False)] = None,
    access_token: Annotated[str | None, Cookie(include_in_schema=False)] = None,
) -> User:
    """
    Marks that the endpoint can only be accessed by authenticated users.

    If user token is missing in headers or cookies,
    or if it's invalid or expired, raises HTTP401 error.

    Returns an IdToken object with the token value and its payload.
    """
    if settings.unsafe_disable_auth:
        return User(
            id_token="",
            access_token="",
            payload={
                "sub": "",
                "exp": 0,
                "email": "",
                "preferred_username": "",
                "name": "",
            },
        )

    if token := extract_bearer_token(authorization):
        if api_key := api_keys.is_valid_key(token):
            return create_api_key_user(api_key)

    if not id_token:
        raise HTTPException(status_code=401)

    return decode_token(id_token, access_token)


def decode_token(id_token: str, access_token: str | None = None) -> User:
    jwk_client = get_jwk_client()
    try:
        if not jwk_client:
            raise HTTPException(
                status_code=401, detail="JWT validation not configured"
            )

        signing_key = jwk_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            key=signing_key.key,
            algorithms=[settings.jwks_alg],
            audience=settings.client_id,
        )
        return User(
            id_token=id_token, access_token=access_token, payload=payload
        )
    except PyJWTError as error:
        logger.error(error)
        raise HTTPException(status_code=401) from error


async def admin_only(
    user: Annotated[User, Depends(authenticated_only)],
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

    if not user:
        raise HTTPException(status_code=401)

    if not await user.is_admin():
        raise HTTPException(status_code=403)


@cached(TTLCache(maxsize=64, ttl=settings.userinfo_ttl))
async def get_groups(access_token: str) -> list[str]:
    """
    Gets user groups from the IdP using the specified ID token.
    """

    oidc_config = get_openid_configuration()
    if not oidc_config.get("userinfo_endpoint"):
        return []

    async with httpx.AsyncClient() as client:
        response = await client.get(
            oidc_config["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.is_success:
            data = response.json()
            return data.get("groups", [])
        text = response.text
        www_authenticate = response.headers.get("www-authenticate")
        logger.warning(
            dedent(f"""
                Failed to retrieve user groups from IdP: {text}
                {www_authenticate}
            """)
        )
        return []
