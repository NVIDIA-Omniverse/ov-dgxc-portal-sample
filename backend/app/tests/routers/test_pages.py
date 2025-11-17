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
