from unittest.mock import AsyncMock

import pytest
from asgi_lifespan import LifespanManager
from fastapi.encoders import jsonable_encoder
from freezegun import freeze_time
from httpx import ASGITransport, AsyncClient

from app.main import api
from app.models import PublishedApp, PublishedAppModel, NvcfFunctionStatus


@pytest.fixture(autouse=True)
def mock_get_nvcf_functions(mocker):
    mock: AsyncMock = mocker.patch("app.routers.apps.get_nvcf_functions")
    mock.return_value = {
        (published_app["function_id"], published_app["function_version_id"]): {
            "id": published_app["function_id"],
            "versionId": published_app["function_version_id"],
            "name": published_app["slug"],
            "status": NvcfFunctionStatus.active,
        }
    }
    yield mock


published_app = jsonable_encoder(
    PublishedApp(
        slug="python",
        function_id="20e5086a-832a-43a6-87c9-6784e2d1e4bd",
        function_version_id="ba4e628b-975b-4e28-9e06-492016a94ec7",
        title="Python",
        description="A test Python application",
        version="3.12.3",
        icon="https://www.python.org/static/favicon.ico",
        page="Test Page",
        category="Test Applications",
        product_area="Omniverse",
    )
)

published_app_response = {
    **published_app,
    "id": "python:3.12",
    "published_at": "2024-06-17T17:00:00Z",
    "status": "ACTIVE",
}


@freeze_time("2024-06-17 17:00:00")
async def test_create_app(client):
    response = await client.put(
        "/apps/python:3.12",
        json=published_app,
    )

    assert response.status_code == 201
    assert (created_data := response.json()) == published_app_response

    response = await client.get(
        "/apps/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == created_data


@freeze_time("2024-06-17 17:00:00")
async def test_create_app_with_slash(client):
    response = await client.put(
        "/apps/test/python:3.12",
        json=published_app,
    )

    assert response.status_code == 201
    assert (created_data := response.json()) == {
        **published_app_response,
        "id": "test/python:3.12",
    }

    response = await client.get(
        "/apps/test/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == created_data


async def test_create_app_is_unauthorized_for_anonymous_user(client):
    del client.cookies["id_token"]

    response = await client.put(
        "/apps/test/python:3.12",
        json=published_app,
    )
    assert response.status_code == 401


async def test_create_app_is_denied_for_non_admin_user(client, user_token):
    client.cookies["id_token"] = user_token
    response = await client.put(
        "/apps/test/python:3.12",
        json=published_app,
    )
    assert response.status_code == 403


@freeze_time("2024-06-17 17:00:00")
async def test_update_app(client):
    response = await client.put(
        "/apps/python:3.12",
        json={**published_app, "version": "3.12.2"},
    )
    assert response.status_code == 201

    response = await client.put(
        "/apps/python:3.12",
        json={**published_app, "version": "3.12.3"},
    )
    assert response.status_code == 200
    assert (updated_data := response.json()) == {
        **published_app_response,
        "version": "3.12.3",
    }

    response = await client.get(
        "/apps/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == updated_data


@freeze_time("2024-06-17 17:00:00")
async def test_get_all_apps(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/")
    assert response.status_code == 200
    assert response.json() == [published_app_response]


@freeze_time("2024-06-17 17:00:00")
async def test_get_active_apps(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get(
        "/apps/", params={"status": NvcfFunctionStatus.active.value}
    )
    assert response.status_code == 200
    assert response.json() == [published_app_response]


@freeze_time("2024-06-17 17:00:00")
async def test_get_apps_filter_by_function_id(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")
    await PublishedAppModel.create(
        **{
            **published_app,
            "id": "python:3.11",
            "function_id": "2525142a-9caa-4536-9541-101bf8ae51ee",
        }
    )

    response = await client.get(
        "/apps/", params={"function_id": published_app["function_id"]}
    )
    assert response.status_code == 200
    assert response.json() == [published_app_response]


@freeze_time("2024-06-17 17:00:00")
async def test_get_apps_filter_by_function_version_id(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")
    await PublishedAppModel.create(
        **{
            **published_app,
            "id": "python:3.11",
            "function_version_id": "ef6c921d-e210-4474-9984-27b69b3092d2",
        }
    )

    response = await client.get(
        "/apps/",
        params={"function_version_id": published_app["function_version_id"]},
    )
    assert response.status_code == 200
    assert response.json() == [published_app_response]


async def test_get_app_not_found(client):
    response = await client.get(
        "/apps/python:3.8",
    )
    assert response.status_code == 404


async def test_delete_app(client):
    response = await client.put(
        "/apps/python:3.12",
        json=published_app,
    )
    assert response.status_code == 201

    response = await client.delete(
        "/apps/python:3.12",
    )
    assert response.status_code == 204

    response = await client.get(
        "/apps/python:3.12",
    )
    assert response.status_code == 404


async def test_delete_app_is_unauthorized_for_anonymous_user(client):
    del client.cookies["id_token"]

    response = await client.delete("/apps/python:3.12")
    assert response.status_code == 401


async def test_delete_app_is_denied_for_non_admin_user(client, user_token):
    client.cookies["id_token"] = user_token

    response = await client.delete(
        "/apps/python:3.12",
    )
    assert response.status_code == 403


@freeze_time("2024-06-17 17:00:00")
async def test_create_app_with_api_key(database):
    async with LifespanManager(api):
        transport = ASGITransport(api)
        async with AsyncClient(
            base_url="http://test",
            headers={"Authorization": "Bearer test-value"},
            follow_redirects=True,
            transport=transport,
        ) as client:
            response = await client.put(
                "/apps/python:3.12",
                json=published_app,
                headers={"Authorization": "Bearer test-value"},
            )

            assert response.status_code == 201
            assert (created_data := response.json()) == published_app_response

            response = await client.get(
                "/apps/python:3.12",
            )
            assert response.status_code == 200
            assert response.json() == created_data
