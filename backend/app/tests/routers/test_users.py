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


async def test_get_current_user_as_admin(client):
    response = await client.get("/users/me")
    assert response.status_code == 200
    assert response.json() == {"is_admin": True}


async def test_get_current_user_as_regular_user(user_client):
    response = await user_client.get("/users/me")
    assert response.status_code == 200
    assert response.json() == {"is_admin": False}


async def test_get_current_user_unauthenticated(database):
    from asgi_lifespan import LifespanManager
    from httpx import ASGITransport, AsyncClient
    from app.main import api

    async with LifespanManager(api):
        transport = ASGITransport(api)
        async with AsyncClient(
            base_url="http://test",
            transport=transport,
        ) as unauthenticated_client:
            response = await unauthenticated_client.get("/users/me")
            assert response.status_code == 401

