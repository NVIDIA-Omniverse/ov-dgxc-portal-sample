# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from fastapi.encoders import jsonable_encoder

from app.models import PublishedApp, PublishedAppModel, PublishedPageModel


async def test_set_pages(client):
    data = [
        {
            "name": "Test Page 1",
            "order": None
        },
        {
            "name": "Test Page 2",
            "order": 1
        }
    ]
    response = await client.put("/pages/", json=data)
    assert response.status_code == 200

    response = await client.get("/pages/")
    assert response.status_code == 200
    assert response.json() == data


async def test_update_pages(client):
    initial_data = [
        {
            "name": "Test Page 1",
            "order": None
        }
    ]
    response = await client.put("/pages/", json=initial_data)
    assert response.status_code == 200

    data = [
        {
            "name": "Test Page 1",
            "order": 1
        },
        {
            "name": "Test Page 2",
            "order": 2
        }
    ]
    response = await client.put("/pages/", json=data)
    assert response.status_code == 200

    response = await client.get("/pages/")
    assert response.status_code == 200
    assert response.json() == data


async def test_get_pages_returns_pages_from_published_apps(client):
    app1 = jsonable_encoder(
        PublishedApp(
            slug="app-1",
            function_id="20e5086a-832a-43a6-87c9-6784e2d1e4bd",
            function_version_id="ba4e628b-975b-4e28-9e06-492016a94ec7",
            title="App 1",
            description="App 1",
            version="1.0",
            icon="https://example.com/icon.png",
            page="Unordered Page",
            category="Test",
            product_area="Test",
        )
    )
    await PublishedAppModel.create(**app1, id="app-1:1.0")

    response = await client.get("/pages/")
    assert response.status_code == 200
    assert response.json() == [{"name": "Unordered Page", "order": None}]


async def test_get_pages_includes_pages_without_apps(client):
    await PublishedPageModel.create(name="Empty Page", order=1)

    response = await client.get("/pages/")
    assert response.status_code == 200
    assert response.json() == [{"name": "Empty Page", "order": 1}]
