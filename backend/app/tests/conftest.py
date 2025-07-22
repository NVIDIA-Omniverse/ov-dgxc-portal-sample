import jwt
import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from app.auth import User
from app.main import api
from app.settings import settings


def pytest_sessionstart(session: pytest.Session) -> None:
    """
    Workaround for pydantic issues with freezegun.
    https://github.com/pydantic/pydantic/discussions/9343#discussioncomment-10723743
    """
    from pydantic._internal._generate_schema import GenerateSchema
    from pydantic_core import core_schema

    initial_match_type = GenerateSchema.match_type

    def match_type(self, obj):
        if getattr(obj, "__name__", None) == "datetime":
            return core_schema.datetime_schema()
        return initial_match_type(self, obj)

    GenerateSchema.match_type = match_type


@pytest.fixture
async def database(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite://:memory:")
    settings.database_url = "sqlite://:memory:"
    try:
        yield
    finally:
        monkeypatch.delenv("DATABASE_URL")


@pytest.fixture
async def client(database, admin_token):
    async for item in configure_client(admin_token):
        yield item


@pytest.fixture
async def user_client(database, user_token):
    async for item in configure_client(user_token):
        yield item


async def configure_client(token):
    async with LifespanManager(api):
        transport = ASGITransport(api)
        async with AsyncClient(
            base_url="http://test",
            cookies={"id_token": token},
            follow_redirects=True,
            transport=transport,
        ) as cl:
            yield cl


@pytest.fixture
def authenticated_only(mocker):
    def decode(id_token: str, access_token: str = None) -> User:
        payload = jwt.decode(id_token, options={"verify_signature": False})
        return User(id_token, payload, access_token)

    mock = mocker.patch('app.auth.decode_token', side_effect=decode)
    yield mock


@pytest.fixture
def admin_token(authenticated_only) -> str:
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvbW5pdmVyc2UiLCJncm91cHMiOlsiYWRtaW4iXX0.E_Kzznv97_AN-X-LX2xXdNixybFW41pWPTOBV10ZY1prQMhtAsgNJdL64PP-Syldnug179z4nARuVZHDiYgIew'


@pytest.fixture
def user_token(authenticated_only) -> str:
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvbW5pdmVyc2UiLCJncm91cHMiOlsidXNlcnMiXX0.Zq1TngaH9eKepdm6AXamW9AU_irlkL96cgniXEOGpKLukZhm6qQq8PjJgAmtwpoI1vk1obWMYwx0MrNwpS9CEQ'


@pytest.fixture
def empty_token(authenticated_only) -> str:
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvbW5pdmVyc2UiLCJncm91cHMiOltdfQ.e4jh3ojrrL-d6i9_bEKG0mJ08_Q4MEfn7a1ywpCXZNR1ZlH0CmanQJpylNC47Jp22zPjCYka9qa5hBhGscTRRg'
