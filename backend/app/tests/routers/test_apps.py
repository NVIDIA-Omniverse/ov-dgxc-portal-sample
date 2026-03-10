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

import pytest
from asgi_lifespan import LifespanManager
from fastapi.encoders import jsonable_encoder
from freezegun import freeze_time
from httpx import ASGITransport, AsyncClient

from app.main import api
from app.models import PublishedApp, PublishedAppModel, NvcfFunctionStatus
from app.settings import settings


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


nvcf_deployment_response = {
    "deployment": {
        "functionId": published_app["function_id"],
        "functionVersionId": published_app["function_version_id"],
        "functionStatus": "ACTIVE",
        "deploymentSpecifications": [
            {
                "gpu": "L40",
                "instanceType": "DGX-CLOUD.GPU.L40_1x",
                "minInstances": 3,
                "maxInstances": 3,
                "maxRequestConcurrency": 1,
                "clusters": ["nvcf-dgxc-k8s-forge-az33-prd1"],
            }
        ],
    }
}


@pytest.fixture(autouse=True)
def mock_nvcf_functions(respx_mock):
    route = respx_mock.get(
        f"{settings.nvcf_control_endpoint}/v2/nvcf/functions"
    ).respond(
        json={
            "functions": [
                {
                    "id": published_app["function_id"],
                    "versionId": published_app["function_version_id"],
                    "name": published_app["slug"],
                    "status": NvcfFunctionStatus.active.value,
                },
                {
                    "id": "2525142a-9caa-4536-9541-101bf8ae51ee",
                    "versionId": published_app["function_version_id"],
                    "name": "python",
                    "status": NvcfFunctionStatus.active.value,
                },
                {
                    "id": published_app["function_id"],
                    "versionId": "ef6c921d-e210-4474-9984-27b69b3092d2",
                    "name": "python",
                    "status": NvcfFunctionStatus.active.value,
                },
            ]
        }
    )
    yield route


@pytest.fixture(autouse=True)
def mock_nvcf_deployment(respx_mock):
    from app.nvcf import nvcf_deployment_cache
    nvcf_deployment_cache.clear()

    fid = published_app["function_id"]
    fvid = published_app["function_version_id"]
    route = respx_mock.get(
        f"{settings.ngc_endpoint}"
        f"/v2/nvcf/deployments/functions/{fid}/versions/{fvid}"
    ).respond(json=nvcf_deployment_response)
    yield route


deployment_details = {
    "instance_type": "DGX-CLOUD.GPU.L40_1x",
    "gpu": "L40",
    "cluster": "nvcf-dgxc-k8s-forge-az33-prd1",
    "min_instances": 3,
    "max_instances": 3,
    "max_request_concurrency": 1,
}


published_app_response = {
    **published_app,
    "id": "python:3.12",
    "published_at": "2024-06-17T17:00:00Z",
    "status": "ACTIVE",
    "deployment": None,
}


@freeze_time("2024-06-17 17:00:00")
async def test_create_app(client):
    response = await client.put(
        "/apps/python:3.12",
        json=published_app,
    )

    assert response.status_code == 201
    assert response.json() == published_app_response

    response = await client.get(
        "/apps/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == {
        **published_app_response,
        "deployment": deployment_details,
    }


@freeze_time("2024-06-17 17:00:00")
async def test_create_app_with_slash(client):
    response = await client.put(
        "/apps/test/python:3.12",
        json=published_app,
    )

    assert response.status_code == 201
    assert response.json() == {
        **published_app_response,
        "id": "test/python:3.12",
    }

    response = await client.get(
        "/apps/test/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == {
        **published_app_response,
        "id": "test/python:3.12",
        "deployment": deployment_details,
    }


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
    assert response.json() == {
        **published_app_response,
        "version": "3.12.3",
    }

    response = await client.get(
        "/apps/python:3.12",
    )
    assert response.status_code == 200
    assert response.json() == {
        **published_app_response,
        "version": "3.12.3",
        "deployment": deployment_details,
    }


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
async def test_get_app_unknown_status_when_not_in_nvcf(client, respx_mock):
    from app.nvcf import nvcf_function_cache, nvcf_deployment_cache

    nvcf_function_cache.clear()
    nvcf_deployment_cache.clear()
    respx_mock.get(
        f"{settings.nvcf_control_endpoint}/v2/nvcf/functions"
    ).respond(json={"functions": []})

    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/python:3.12")
    assert response.status_code == 200
    assert response.json()["status"] == NvcfFunctionStatus.unknown.value


@freeze_time("2024-06-17 17:00:00")
async def test_get_app_handles_nvcf_error(client, respx_mock):
    from app.nvcf import nvcf_function_cache, nvcf_deployment_cache

    nvcf_function_cache.clear()
    nvcf_deployment_cache.clear()
    respx_mock.get(
        f"{settings.nvcf_control_endpoint}/v2/nvcf/functions"
    ).respond(status_code=500)

    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/python:3.12")
    assert response.status_code == 200
    assert response.json()["status"] == NvcfFunctionStatus.unknown.value


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
            assert response.json() == published_app_response

            response = await client.get(
                "/apps/python:3.12",
            )
            assert response.status_code == 200
            assert response.json() == {
                **published_app_response,
                "deployment": deployment_details,
            }


@freeze_time("2024-06-17 17:00:00")
async def test_get_app_includes_deployment_details(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/python:3.12")
    assert response.status_code == 200
    data = response.json()
    assert data["deployment"] == deployment_details


@freeze_time("2024-06-17 17:00:00")
async def test_get_app_deployment_null_when_nvcf_returns_error(
    client, respx_mock
):
    from app.nvcf import nvcf_deployment_cache

    nvcf_deployment_cache.clear()
    fid = published_app["function_id"]
    fvid = published_app["function_version_id"]
    respx_mock.get(
        f"{settings.ngc_endpoint}"
        f"/v2/nvcf/deployments/functions/{fid}/versions/{fvid}"
    ).respond(status_code=500)

    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/python:3.12")
    assert response.status_code == 200
    assert response.json()["deployment"] is None


@freeze_time("2024-06-17 17:00:00")
async def test_get_app_deployment_null_when_function_not_deployed(
    client, respx_mock
):
    from app.nvcf import nvcf_deployment_cache

    nvcf_deployment_cache.clear()
    fid = published_app["function_id"]
    fvid = published_app["function_version_id"]
    respx_mock.get(
        f"{settings.ngc_endpoint}"
        f"/v2/nvcf/deployments/functions/{fid}/versions/{fvid}"
    ).respond(status_code=404)

    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/python:3.12")
    assert response.status_code == 200
    assert response.json()["deployment"] is None


@freeze_time("2024-06-17 17:00:00")
async def test_list_apps_does_not_include_deployment_details(client):
    await PublishedAppModel.create(**published_app, id="python:3.12")

    response = await client.get("/apps/")
    assert response.status_code == 200
    apps = response.json()
    assert len(apps) == 1
    assert apps[0]["deployment"] is None


@freeze_time("2024-06-17 17:00:00")
async def test_get_app_deployment_is_cached(client, mock_nvcf_deployment):
    await PublishedAppModel.create(**published_app, id="python:3.12")

    await client.get("/apps/python:3.12")
    await client.get("/apps/python:3.12")

    assert mock_nvcf_deployment.call_count == 1
