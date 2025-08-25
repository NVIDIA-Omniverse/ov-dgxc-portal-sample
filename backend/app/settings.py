import asyncio
import logging
import os
import sys
import tomllib
from dataclasses import dataclass, field
from textwrap import dedent

logger = logging.getLogger("uvicorn.error")

settings_path = os.getenv("SETTINGS_PATH", "settings.toml")

# Maximum session length for NVCF functions on GFN is 8 hours.
MAX_SESSION_TTL = 60 * 60 * 8


@dataclass
class Settings:
    """
    TOML settings loaded from the path specified in SETTINGS_PATH
    environment variable (settings.toml by default).

    The service watches file changes every 15 seconds automatically
    (configurable with `watch_interval` field).
    """

    """The client ID registered in the IdP for this example."""
    client_id: str | None = None

    """
    Starfleet API Key that will be injected into /sessions/sign_in endpoint.
    """
    nvcf_api_key: str | None = None

    """The endpoint used by the backend to talk to NVCF API."""
    nvcf_control_endpoint: str = "https://api.nvcf.nvidia.com"

    """
    The endpoint used by the backend to 
    connect to NVCF functions with WebSockets.
    """
    nvcf_signaling_endpoint: str = "wss://grpc.nvcf.nvidia.com"

    """Number of seconds to cache data pulled from nvcf_control_endpoint."""
    nvcf_cache_ttl: int = 60 * 5

    root_path: str | None = None
    database_url: str = "sqlite://db/db.sqlite3"

    """Specifies all origins allowed for cross-domain requests (CORS)."""
    allowed_origins: list[str] = field(
        default_factory=lambda: [
            "http://localhost:3180",
            "http://127.0.0.1:3180",
            "https://localhost:3180",
        ]
    )

    """The user group required for updating or deleting data via the API."""
    admin_group: str = "admin"

    """Defines what field in the token should be used for checking user groups."""
    groups_claim: str = "groups"

    """
    Disables authentication for this backend.
    Use only for development.
    """
    unsafe_disable_auth: bool = False

    """
    The endpoint used to retrieve OpenID Connect configuration
    from the identity provider.
    https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
    """
    metadata_uri: str | None = None

    """The algorithm used by the IdP to generate ID tokens."""
    jwks_alg: str = "ES256"

    """Number of seconds to cache public keys (JWK) retrieved from jwks_uri."""
    jwks_ttl: int = 60 * 15

    """Number of seconds to cache user info retrieved from userinfo_endpoint."""
    userinfo_ttl: int = 60 * 15

    """
    Maximum number of instances of the same application
    that can be launched by a user.
    """
    max_app_instances_count: int = 3

    """
    Maximum session duration in seconds before users get disconnected.
    """
    session_ttl: int = 60 * 60 * 8

    """
    Defines how often (in seconds) the service checks for session aliveness 
    (timeouts and idle state).
    """
    session_watch_interval: int = 60

    """
    Number of seconds before idle sessions are stopped. 
    The default value is equal to NVCF session reconnect timeout. 
    """
    session_idle_timeout: int = 60 * 5

    """Number of seconds to wait before settings are read again from disk."""
    watch_interval: int = 15

    """Maximum size of incomplete HTTP events (headers) in bytes for h11. Default is 16KB."""
    h11_max_incomplete_event_size: int = 16 * 1024

    __listening_task: asyncio.Task | None = None

    @classmethod
    def read(cls):
        with open(settings_path) as file:
            content = file.read()
            data = tomllib.loads(content)

            instance = cls(**data)
            instance.__last_content = content
            instance.validate()

            return instance

    def listen(self):
        if self.__listening_task is not None:
            return

        async def _listen():
            while True:
                await asyncio.sleep(self.watch_interval)

                with open(settings_path) as file:
                    content = file.read()
                    if content == self.__last_content:
                        continue

                    logger.info("Service configuration has been updated.")
                    data = tomllib.loads(content)
                    for key, value in data.items():
                        if hasattr(self, key):
                            setattr(self, key, value)
                    self.__last_content = content
                    self.validate()

        self.__listening_task = asyncio.create_task(_listen())

    def stop(self):
        if self.__listening_task is not None:
            self.__listening_task.cancel()

    def validate(self):
        if not self.unsafe_disable_auth and not self.metadata_uri:
            raise ValueError("You must specify a metadata URI.")

        if self.session_ttl > MAX_SESSION_TTL:
            logger.warning(
                dedent(
                    "Session TTL exceeds maximum allowed value, "
                    "using the default timeout (8 hours)."
                )
            )
            self.session_ttl = MAX_SESSION_TTL

    def tortoise_orm(self):
        return {
            "connections": {
                "default": self.database_url,
            },
            "apps": {
                "models": {
                    "models": ["app.models", "aerich.models"],
                    "default_connection": "default",
                }
            },
        }


if "pytest" in sys.modules:
    settings = Settings(
        client_id="test-client-id", nvcf_api_key="test-nvcf-api-key"
    )
else:
    settings = Settings.read()
    if settings.unsafe_disable_auth:
        logger.warning(
            dedent(
                f"""
            -----------------------------------------------
            !!!!!!!!!!!!!!!!!! WARNING !!!!!!!!!!!!!!!!!!!!
            -----------------------------------------------
            AUTHENTICATION IS DISABLED WITH `unsafe_disable_auth` setting in {settings_path}.
            USE THIS OPTION ONLY FOR TESTING.
            -----------------------------------------------
            """
            )
        )


TORTOISE_ORM = settings.tortoise_orm()
