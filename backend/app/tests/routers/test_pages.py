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
