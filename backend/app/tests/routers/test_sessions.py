import asyncio
import datetime
import uuid
from contextlib import asynccontextmanager

import pytest
import uvicorn
import websockets
from freezegun import freeze_time
from tortoise.signals import Signals
from websockets.asyncio.client import connect
from websockets.asyncio.server import serve, ServerConnection

from app.models import SessionModel, SessionStatus, PublishedAppModel
from app.routers.sessions import construct_nvcf_endpoint
from app.settings import settings

host = "127.0.0.1:12340"
function_id = "20e5086a-832a-43a6-87c9-6784e2d1e4bd"
function_version_id = "ba4e628b-975b-4e28-9e06-492016a94ec7"
path = f"/sessions/{function_id}/{function_version_id}/sign_in"
url = f"ws://{host}{path}"


@pytest.fixture
def nvcf_endpoint():
    original_nvcf_signaling_endpoint = settings.nvcf_signaling_endpoint
    settings.nvcf_signaling_endpoint = f"ws://127.0.0.1:12345"
    yield settings.nvcf_signaling_endpoint
    settings.nvcf_signaling_endpoint = original_nvcf_signaling_endpoint


@pytest.fixture
def session_timeout():
    session_ttl = settings.session_ttl
    settings.session_ttl = 1

    session_watch_interval = settings.session_watch_interval
    settings.session_watch_interval = 1

    yield settings.session_ttl
    settings.session_ttl = session_ttl
    settings.session_watch_interval = session_watch_interval


@pytest.fixture
def nvcf_server(nvcf_endpoint):
    @asynccontextmanager
    async def start_nvcf(accept):
        async with serve(accept, "localhost", 12345):
            yield

    return start_nvcf


@pytest.fixture
async def websocket_server(database):
    config = uvicorn.Config(
        "app.main:api",
        host="127.0.0.1",
        port=12340,
        log_level="debug",
        reload=False,
        ws_ping_interval=None,
        ws_ping_timeout=None,
        timeout_graceful_shutdown=3,
    )
    server = uvicorn.Server(config)
    server.should_exit = True

    await server.serve()
    try:
        yield server
    finally:
        await server.shutdown()


@pytest.fixture
def create_session():
    count = 0

    async def create(
        status: SessionStatus, app: PublishedAppModel | None = None
    ):
        nonlocal count
        count += 1

        return await SessionModel.create(
            id=str(uuid.uuid4()),
            function_id=function_id,
            function_version_id=function_version_id,
            user_id="omniverse",
            user_name="omniverse",
            status=status,
            start_date=(
                datetime.datetime.now() + datetime.timedelta(seconds=count)
            ),
            end_date=(
                datetime.datetime.now() + datetime.timedelta(seconds=count)
            ),
            app=app,
        )

    return create


@pytest.fixture
def create_app():
    async def create():
        return await PublishedAppModel.create(
            id=str(uuid.uuid4()),
            slug="test-app",
            function_id=function_id,
            function_version_id=function_version_id,
            title="Test App",
            description="",
            version="1.0.0",
            image="https://www.python.org/static/img/python-logo@2x.png",
            icon="https://www.python.org/static/favicon.ico",
            category="",
            product_area="",
        )

    return create


@pytest.fixture
async def cookies(user_token, create_session):
    session = await create_session(status=SessionStatus.idle)
    return f"id_token={user_token}; nvcf-request-id={session.id}"


@freeze_time("2024-09-03 23:00:00")
async def test_session_start(nvcf_endpoint, respx_mock, user_client):
    nvcf_endpoint_http = construct_nvcf_endpoint()
    nvcf = respx_mock.post(nvcf_endpoint_http).respond(cookies={
        "nvcf-request-id": "test-id"
    })

    response = await user_client.post(url)
    assert response.status_code == 200

    nvcf_request_id = response.cookies.get(
        "nvcf-request-id",
        domain="127.0.0.1",
        path=path
    )
    assert nvcf_request_id == "test-id"

    nvcf_request_id = response.cookies.get(
        "nvcf-request-id",
        domain="127.0.0.1",
        path=f"/stream/{function_id}/{function_version_id}"
    )
    assert nvcf_request_id == "test-id"
    assert nvcf.called

    session = await SessionModel.get(
        function_id=function_id,
        function_version_id=function_version_id,
        user_id="omniverse",
    )
    assert session.status == SessionStatus.idle
    assert str(session.start_date) == "2024-09-03 23:00:00+00:00"


async def test_session_start_too_many_sessions(nvcf_endpoint, respx_mock, user_client):
    nvcf_endpoint_http = construct_nvcf_endpoint()
    nvcf = respx_mock.post(nvcf_endpoint_http).respond(cookies={
        "nvcf-request-id": "test-id"
    })

    response = await user_client.post(url)
    assert response.status_code == 200

    response = await user_client.post(url)
    assert response.status_code == 429

    data = response.json()
    assert data["detail"] == "Maximum number of instances reached (1)."
    assert nvcf.call_count == 1


@freeze_time("2024-09-03 23:00:00")
async def test_session_sign_in(
    nvcf_server, websocket_server, cookies
):
    async def accept(websocket: ServerConnection):
        await websocket.send("SYN")
        recv = await websocket.recv()
        if recv == "ACK":
            await websocket.send("SYN ACK")

    async with nvcf_server(accept):
        async with connect(
            url, additional_headers={"Cookie": cookies}
        ) as ws:
            msg = await ws.recv()
            assert msg == "SYN"

            await ws.send("ACK")
            msg = await ws.recv()
            assert msg == "SYN ACK"

            session = await SessionModel.get(
                function_id=function_id,
                function_version_id=function_version_id,
            )
            assert session.id is not None
            assert session.status == SessionStatus.active

            await ws.close()
            session = await SessionModel.get(
                function_id=function_id,
                function_version_id=function_version_id,
            )
            assert session.status == SessionStatus.idle
            assert str(session.end_date) == "2024-09-03 23:00:00+00:00"


async def test_session_sign_in_server_close_abnormally(
    nvcf_server, websocket_server, cookies
):
    async def accept(websocket: ServerConnection):
        await websocket.close(code=1011, reason="Test error.")

    async with nvcf_server(accept):
        with pytest.raises(websockets.exceptions.ConnectionClosedError):
            async with connect(
                url, additional_headers={"Cookie": cookies}
            ) as ws:
                await ws.recv()

        session = await SessionModel.get(
            function_id=function_id,
            function_version_id=function_version_id,
        )
        assert session.status == SessionStatus.idle


async def test_session_sign_in_client_close_abnormally(
    nvcf_server, websocket_server, cookies
):
    stopped_event = asyncio.Event()

    async def listener(model, instance: SessionModel, *args):
        if instance.status == SessionStatus.idle:
            stopped_event.set()

    SessionModel.register_listener(Signals.post_save, listener)

    async def accept(websocket: ServerConnection):
        with pytest.raises(websockets.exceptions.ConnectionClosedError):
            await websocket.send("SYN")
            recv = await websocket.recv()
            if recv == "ACK":
                await websocket.send("SYN ACK")

    async with nvcf_server(accept):
        async with connect(
            url, additional_headers={"Cookie": cookies}
        ) as ws:
            msg = await ws.recv()
            assert msg == "SYN"

            await ws.send("ACK")
            await ws.close(code=1011, reason="Test error.")

    await asyncio.wait_for(stopped_event.wait(), timeout=5)

    session = await SessionModel.get(
        function_id=function_id,
        function_version_id=function_version_id,
    )
    assert session.status == SessionStatus.idle


async def test_session_sign_in_connected_already(
    nvcf_server, websocket_server, cookies
):
    connected = asyncio.Event()

    async def accept(websocket: ServerConnection):
        await websocket.send("SYN")
        recv = await websocket.recv()
        if recv == "ACK":
            await websocket.send("SYN ACK")
        await websocket.recv()

    async def send():
        async with connect(
            url, additional_headers={"Cookie": cookies}
        ) as ws:
            recv = await ws.recv()
            assert recv == "SYN"

            await ws.send("ACK")
            recv = await ws.recv()
            assert recv == "SYN ACK"

            connected.set()
            await ws.recv()

    async with nvcf_server(accept):
        task = asyncio.create_task(send())

        await asyncio.wait_for(connected.wait(), timeout=5)
        try:
            with pytest.raises(websockets.ConnectionClosedError) as err:
                async with connect(
                    url, additional_headers={"Cookie": cookies}
                ) as ws:
                    await ws.recv()
            assert err.value.rcvd.code == 3005
            assert err.value.rcvd.reason == "Client is connected already."
        finally:
            task.cancel()


async def test_session_sign_in_stopped(
    nvcf_server, websocket_server, user_token, cookies
):
    async def accept(websocket: ServerConnection):
        await websocket.close(code=1011, reason="Test error.")

    async with nvcf_server(accept):
        session = await SessionModel.get(
            function_id=function_id,
            function_version_id=function_version_id,
        )
        session.status = SessionStatus.stopped
        await session.save()

        with pytest.raises(websockets.exceptions.ConnectionClosedError) as err:
            async with connect(
                url, additional_headers={"Cookie": cookies}
            ) as ws:
                await ws.recv()

        assert err.value.rcvd.code == 3004
        assert err.value.rcvd.reason == "Session with the specified ID not found."


async def test_session_sign_in_not_found(
    nvcf_server, websocket_server, cookies
):
    async def accept(websocket: ServerConnection):
        await websocket.close(code=1011, reason="Test error.")

    session = await SessionModel.get(
        function_id=function_id,
        function_version_id=function_version_id,
    )
    await session.delete()

    async with nvcf_server(accept):
        with pytest.raises(websockets.exceptions.ConnectionClosedError) as err:
            async with connect(
                url, additional_headers={"Cookie": cookies}
            ) as ws:
                await ws.recv()

        assert err.value.rcvd.code == 3004
        assert err.value.rcvd.reason == "Session with the specified ID not found."


async def test_session_sign_in_session_without_cookie(
    nvcf_server, websocket_server, user_token
):
    async def accept(websocket: ServerConnection):
        await websocket.close(code=1011, reason="Test error.")

    async with nvcf_server(accept):
        with pytest.raises(websockets.exceptions.ConnectionClosedError) as err:
            async with connect(
                url, additional_headers={"Cookie": f"id_token={user_token}"}
            ) as ws:
                await ws.recv()

        assert err.value.rcvd.code == 3000
        assert err.value.rcvd.reason == "Session ID is not specified (missing nvcf-request-id cookie)."


async def test_get_all_sessions(client, create_session, create_app):
    app = await create_app()

    stopped_session = await create_session(SessionStatus.stopped)
    active_session = await create_session(SessionStatus.active, app=app)
    connecting_session = await create_session(SessionStatus.connecting)

    response = await client.get("/sessions")
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 3
    assert data["total_size"] == 3
    assert data["total_pages"] == 1

    for index, session in enumerate(
        [connecting_session, active_session, stopped_session]
    ):
        session_data = data["items"][index]
        assert session_data["id"] == session.id
        assert session_data["status"] == session.status
        if session.app is None:
            assert session_data["app"] is None
        else:
            assert session_data["app"]["id"] == session.app.id
            assert session_data["app"]["title"] == session.app.title
            assert session_data["app"]["version"] == session.app.version


async def test_get_sessions_filtered_by_status(client, create_session):
    await create_session(SessionStatus.stopped)
    await create_session(SessionStatus.connecting)
    active_session = await create_session(SessionStatus.active)

    response = await client.get(
        "/sessions", params={"status": SessionStatus.active.value}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert data["total_size"] == 1
    assert data["total_pages"] == 1

    assert data["items"][0]["id"] == active_session.id
    assert data["items"][0]["status"] == SessionStatus.active


async def test_get_sessions_pagination(client, create_session):
    pages = 3
    page_size = 5

    sessions = []
    for page_item in range(0, pages * page_size):
        session = await create_session(SessionStatus.stopped)
        sessions.append(session)
    sessions = list(reversed(sessions))

    page = 2
    response = await client.get(
        "/sessions", params={"page": page, "page_size": page_size}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == page
    assert data["page_size"] == page_size
    assert data["total_size"] == pages * page_size
    assert data["total_pages"] == pages

    offset = (page - 1) * page_size
    for page_item_index, offset_index in enumerate(
        range(offset, offset + page_size)
    ):
        session_data = data["items"][page_item_index]
        session = sessions[offset_index]
        assert session_data["id"] == session.id


async def test_get_sessions_pagination_filtered_by_status(
    client, create_session
):
    pages = 4
    page_size = 5

    sessions = []
    for page_item in range(0, pages * page_size):
        session = await create_session(SessionStatus.stopped)
        sessions.append(session)

        session = await create_session(SessionStatus.active)
        sessions.append(session)
    sessions = list(reversed(sessions))

    page = 2
    response = await client.get(
        "/sessions",
        params={
            "page": page,
            "page_size": page_size,
            "status": SessionStatus.active.value,
        },
    )
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == page
    assert data["page_size"] == page_size
    assert data["total_size"] == pages * page_size
    assert data["total_pages"] == pages

    offset = (page - 1) * page_size * 2
    for index in range(0, page_size):
        session_data = data["items"][index]
        session = sessions[offset + index * 2]
        assert session_data["id"] == session.id


async def test_stop_session(
    nvcf_server, websocket_server, user_client, user_token,
    create_session, respx_mock, cookies
):
    connected = asyncio.Event()

    session = await create_session(SessionStatus.idle)

    async def accept(websocket: ServerConnection):
        await websocket.send("SYN")
        await websocket.recv()

    async def send():
        async with nvcf_server(accept):
            with pytest.raises(websockets.ConnectionClosedError) as err:
                async with connect(
                    url,
                    additional_headers={"Cookie": f"id_token={user_token}; nvcf-request-id={session.id}"}
                ) as ws:
                    syn = await ws.recv()
                    assert syn == "SYN"

                    connected.set()
                    await ws.recv()
            assert err.value.rcvd.code == 3010
            assert err.value.rcvd.reason == "Stopped by client."

    task = asyncio.create_task(send())
    await asyncio.wait_for(connected.wait(), 5)

    nvcf = respx_mock.delete(construct_nvcf_endpoint())
    response = await user_client.delete(url, cookies={"nvcf-request-id": session.id})
    assert response.status_code == 200
    assert nvcf.called

    await session.refresh_from_db()
    assert session.status == SessionStatus.stopped

    await task


async def test_stop_session_not_found(user_client):
    response = await user_client.delete(url, cookies={"nvcf-request-id": "test-id"})
    assert response.status_code == 404

    data = response.json()
    assert data["detail"] == "Session not found."


async def test_stop_session_without_cookie(user_client):
    response = await user_client.delete(url)
    assert response.status_code == 400

    data = response.json()
    assert data["detail"] == "nvcf-request-id must be specified in cookies."


async def test_terminate_session(
    nvcf_server, websocket_server, client, respx_mock, cookies
):
    connected = asyncio.Event()

    async def accept(websocket: ServerConnection):
        await websocket.send("SYN")
        await websocket.recv()

    async def send():
        async with nvcf_server(accept):
            with pytest.raises(websockets.ConnectionClosedError) as err:
                async with connect(
                    url, additional_headers={"Cookie": cookies}
                ) as ws:
                    syn = await ws.recv()
                    assert syn == "SYN"

                    connected.set()
                    await ws.recv()
            assert err.value.rcvd.code == 3010
            assert err.value.rcvd.reason == "Terminated by a system administrator."

    task = asyncio.create_task(send())
    await asyncio.wait_for(connected.wait(), 5)

    response = await client.get(
        "/sessions/",
        params={"status": SessionStatus.active.value}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page_size"] == 1
    session = data["items"][0]

    nvcf = respx_mock.delete(construct_nvcf_endpoint())

    response = await client.delete(f"/sessions/{session["id"]}/terminate")
    assert response.status_code == 200
    assert nvcf.called

    response = await client.get("/sessions/")
    assert response.status_code == 200
    data = response.json()
    assert data["page_size"] == 1
    session = data["items"][0]
    assert session["status"] == SessionStatus.stopped

    await task


async def test_session_timeout(
    session_timeout, nvcf_server, websocket_server, cookies, respx_mock
):
    connected = asyncio.Event()

    async def accept(websocket: ServerConnection):
        while True:
            await websocket.send("SYN")
            await websocket.recv()
            await asyncio.sleep(0.5)

    async def send():
        async with nvcf_server(accept):
            with pytest.raises(websockets.ConnectionClosedError) as err:
                async with connect(
                    url, additional_headers={"Cookie": cookies}
                ) as ws:
                    while True:
                        syn = await ws.recv()
                        assert syn == "SYN"

                        connected.set()
                        await ws.recv()

                        await asyncio.sleep(0.5)
            assert err.value.rcvd.code == 3010
            assert err.value.rcvd.reason == "Timed out."

    task = asyncio.create_task(send())
    await asyncio.wait_for(connected.wait(), 5)

    nvcf = respx_mock.delete(construct_nvcf_endpoint())
    await asyncio.wait_for(task, 5)
    assert nvcf.called


async def test_terminate_session_is_unauthorized_for_anonymous_user(client):
    del client.cookies["id_token"]

    response = await client.delete("/sessions/test/terminate")
    assert response.status_code == 401


async def test_terminate_session_is_denied_for_non_admin_user(
    client, user_token
):
    client.cookies["id_token"] = user_token

    response = await client.delete("/sessions/test/terminate")
    assert response.status_code == 403


async def test_terminate_session_not_found(client):
    response = await client.delete("/sessions/test/terminate")
    assert response.status_code == 404
