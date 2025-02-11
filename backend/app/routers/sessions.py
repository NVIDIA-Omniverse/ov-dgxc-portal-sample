import asyncio
import datetime
import http.cookies
import logging
import urllib.parse
from math import ceil
from textwrap import dedent
from typing import Annotated

import httpx
import starlette.websockets
from fastapi import (
    APIRouter, Query, Depends, HTTPException,
    Request, Response, Header
)
from fastapi.params import Cookie
from starlette import status
from starlette.datastructures import MutableHeaders, QueryParams
from starlette.websockets import WebSocket, WebSocketDisconnect
from tortoise.transactions import in_transaction
from websockets import ConnectionClosedError, InvalidStatus
from websockets.asyncio.client import connect

from app.auth import authenticated_only, IdToken, admin_only
from app.models import (
    SessionModel, SessionStatus, SessionResponse, Page, PublishedAppModel,
    AuthenticationType
)
from app.settings import settings

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

# Stores a mapping between session id and the corresponding client websocket.
session_websockets: dict[str, WebSocket] = {}


async def watch_session_timeout():
    while True:
        logger.debug("Retrieving timed-outed sessions...")

        sessions = await SessionModel.filter(
            status__not=str(SessionStatus.stopped.value),
            start_date__lte=datetime.datetime.now() - datetime.timedelta(
                seconds=settings.session_ttl),
        )
        logger.debug(f"Found {len(sessions)} timed-outed sessions.")

        for session in sessions:
            await end_session(session, reason="Timed out.")
        await asyncio.sleep(settings.session_watch_interval)


async def watch_idle_sessions():
    while True:
        logger.debug("Check idle sessions...")

        sessions = await SessionModel.filter(
            status=SessionStatus.idle.value,
            end_date__lte=datetime.datetime.now() - datetime.timedelta(
                seconds=settings.session_idle_timeout
            )
        )
        logger.debug(f"Found {len(sessions)} idle sessions.")

        for session in sessions:
            logger.debug(f"[{session.id}] Stop as idle.")
            session.status = SessionStatus.stopped
            await session.save()
        await asyncio.sleep(settings.session_watch_interval)


@router.post("/sessions/{function_id}/{function_version_id}/sign_in")
async def start_stream(
    request: Request,
    function_id: str,
    function_version_id: str,
    user: Annotated[IdToken, Depends(authenticated_only)],
):
    assert settings.nvcf_api_key, (
        "Starfleet API Key must be configured for "
        "establishing a streaming session."
    )

    logger.info(
        dedent(
            f"""Starting a streaming session:
                        function_id: {function_id}
                        function_version_id: {function_version_id} 
                """
        )
    )

    # Start a transaction to block SQLite database until this is resolved.
    # Use `select_for_update` as a lock mechanism in MySQL or PostgreSQL.
    async with in_transaction():
        # Count all other user sessions that are not currently stopped
        running_instances = await SessionModel.filter(
            function_id=function_id,
            function_version_id=function_version_id,
            status__not=str(SessionStatus.stopped.value),
            user_id=user.sub,
        ).count()

        if running_instances + 1 > settings.max_app_instances_count:
            logger.info(
                "Block session request - maximum number of instances reached."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Maximum number of instances reached "
                    f"({running_instances})."
                ),
            )

        app = await PublishedAppModel.get_or_none(
            function_id=function_id,
            function_version_id=function_version_id,
        )

        url = construct_nvcf_endpoint(request.query_params)
        headers = {
            # Specify the Starfleet API Key for calling an NVCF function
            "Authorization": f"Bearer {settings.nvcf_api_key}",

            # Specify which NVCF function must be called
            "Function-ID": function_id,

            # Specify what version of the NVCF function must be called
            "Function-Version-ID": function_version_id,

            # Required NVCF header for starting a streaming session
            "X-NVCF-ABSORB": "true"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers)

                if response.status_code == status.HTTP_200_OK:
                    cookies = response.headers.pop("set-cookie", "")
                    cookies = http.cookies.SimpleCookie(cookies)
                    session_id = cookies.get("nvcf-request-id")

                    logger.info(f"[{session_id.value}] Started.")

                    # Register the current session in the database
                    await SessionModel.create(
                        id=session_id.value,
                        function_id=function_id,
                        function_version_id=function_version_id,
                        user_id=user.sub,
                        user_name=user.username,
                        status=SessionStatus.idle,
                        app=app,
                    )

                    # Return the session ID as a header for the streaming library
                    response.headers["nvcf-request-id"] = session_id.value

                response = Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=response.headers,
                )
                if response.status_code == status.HTTP_200_OK:
                    api_cookies = http.cookies.SimpleCookie()
                    api_cookies["nvcf-request-id"] = session_id.value
                    api_cookies["nvcf-request-id"]["max-age"] = settings.session_ttl
                    api_cookies["nvcf-request-id"]["path"] = request.url.path

                    client_cookies = http.cookies.SimpleCookie()
                    client_cookies["nvcf-request-id"] = session_id.value
                    client_cookies["nvcf-request-id"]["max-age"] = settings.session_ttl
                    client_cookies["nvcf-request-id"]["path"] = f"/stream/{function_id}/{function_version_id}"

                    response.headers.append("set-cookie", get_cookie_values(api_cookies))
                    response.headers.append("set-cookie", get_cookie_values(client_cookies))
                return response
        except httpx.TimeoutException:
            return Response(
                content="Failed to start a streaming session with a timeout -- try again later.",
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
            )


@router.delete("/sessions/{function_id}/{function_version_id}/sign_in")
async def stop_stream(
    request: Request,
    function_id: str,
    function_version_id: str,
    user: Annotated[IdToken, Depends(authenticated_only)],
    nvcf_request_id: Annotated[str | None, Cookie(alias="nvcf-request-id")] = None,
):
    if nvcf_request_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="nvcf-request-id must be specified in cookies.",
            headers=set_session_expired_cookies(
                function_id, function_version_id
            ),
        )

    session = await SessionModel.get_or_none(
        id=nvcf_request_id,
        function_id=function_id,
        function_version_id=function_version_id,
    )
    if session is None or session.user_id != user.sub or session.status == SessionStatus.stopped:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session not found.",
            headers=set_session_expired_cookies(function_id, function_version_id)
        )
    response = await end_session(session, reason="Stopped by client.")
    response.headers.update(set_session_expired_cookies(function_id, function_version_id))
    return response


async def end_session(session: SessionModel, reason: str) -> Response:
    url = construct_nvcf_endpoint()

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"[{session.id}] Terminating session, reason: {reason}")
            response = await client.delete(
                url,
                cookies={
                    "nvcf-request-id": session.id,
                },
                headers={
                    # Specify the Starfleet API Key for calling an NVCF function
                    "Authorization": f"Bearer {settings.nvcf_api_key}",

                    # Specify which NVCF function must be called
                    "Function-ID": str(session.function_id),

                    # Specify what version of the NVCF function must be called
                    "Function-Version-ID": str(session.function_version_id),

                    # Required NVCF header for stopping a streaming session
                    "X-NVCF-ABSORB": "true"
                }
            )

            if response.status_code == status.HTTP_200_OK:
                ws = session_websockets.get(session.id)
                if ws is not None:
                    await ws.close(code=3010, reason=reason)
            else:
                logger.error(f"[{session.id}] Failed to terminate session: HTTP{response.status_code} -- {response.text}.\nHeaders:\n{response.headers}")

            session.status = SessionStatus.stopped
            session.end_date = datetime.datetime.now(tz=datetime.timezone.utc)
            await session.save()

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response.headers,
        )
    except httpx.TimeoutException:
        return Response(
            content="Failed to terminate session with a timeout -- try again later.",
            status_code=status.HTTP_408_REQUEST_TIMEOUT
        )


# This path is used by Omniverse Web Streaming Library internally
# and must end with /sign_in.
@router.websocket(
    "/sessions/{function_id}/{function_version_id}/sign_in",
)
async def connect_to_stream(
    websocket: WebSocket,
    function_id: str,
    function_version_id: str,
    user: Annotated[IdToken, Depends(authenticated_only)],
):
    """
    This endpoint is called by the client for establishing
    the signaling connection and exchanging WebRTC information with the
    Kit container.

    The connection must be forwarded to NVCF with the Authorization header
    that includes the API key, and Function-ID and Function-Version-ID headers
    to specify which container needs to be invoked.

    :param websocket:
    :param function_id: Specifies NVCF function ID for the streaming app.
    :param function_version_id: Specifies NVCF function version for the streaming app.
    :param user:
    :return:
    """

    assert settings.nvcf_api_key, (
        "Starfleet API Key must be configured for "
        "establishing a streaming session."
    )

    await websocket.accept(
        # Must send the sub-protocol back to the client to accept the connection
        subprotocol=websocket.headers.get("sec-websocket-protocol"),
    )

    nvcf_request_id = websocket.cookies.get("nvcf-request-id")
    if not nvcf_request_id:
        await websocket.close(
            code=3000,
            reason="Session ID is not specified (missing nvcf-request-id cookie)."
        )
        return

    session = await SessionModel.get_or_none(
        id=nvcf_request_id,
        function_id=function_id,
        function_version_id=function_version_id,
        user_id=user.sub,
    )
    if session is None or session.status == SessionStatus.stopped:
        # If session is not found or was stopped, close the connection.
        await websocket.close(
            code=3004,
            reason="Session with the specified ID not found."
        )
        return

    if session.status == SessionStatus.active:
        # Disallow more than one websocket connection to the same session.
        await websocket.close(
            code=3005,
            reason="Client is connected already."
        )
        return

    # Store the websocket connection in memory
    # to let other endpoints terminate it
    session_websockets[nvcf_request_id] = websocket

    logger.info(
        dedent(
            f"""Connecting to a streaming session:
                    function_id: {function_id}
                    function_version_id: {function_version_id}
                    nvcf_request_id: {nvcf_request_id} 
            """
        )
    )

    code, reason = 1000, None
    try:
        session.status = SessionStatus.connecting
        await session.save()

        query_params = {**websocket.query_params}
        query = urllib.parse.urlencode(query_params)

        # The StreamSDK inside the Kit application listens for
        # incoming WebSocket connections on /sign_in endpoint.
        url = f"{settings.nvcf_signaling_endpoint}/sign_in?{query}"
        logger.info(f"[{nvcf_request_id}] Connecting to NVCF: {url}")

        headers = {
            # Specify the Starfleet API Key for calling an NVCF function
            "Authorization": f"Bearer {settings.nvcf_api_key}",

            # Specify which NVCF function must be called
            "Function-ID": function_id,

            # Specify what version of the NVCF function must be called
            "Function-Version-ID": function_version_id,

            # Specify the streaming session ID in cookies
            "Cookie": f"nvcf-request-id={nvcf_request_id}",
        }

        logger.debug(f"[{nvcf_request_id}] WebSocket cookies: {websocket.cookies}")
        logger.debug(f"[{nvcf_request_id}] WebSocket headers: {websocket.headers}")

        app = await PublishedAppModel.get_or_none(
            function_id=function_id,
            function_version_id=function_version_id,
        )
        if app:
            if app.authentication_type == AuthenticationType.openid.value:
                # Specify the ID token received from the IdP
                headers["User-Token"] = user.token
            elif app.authentication_type == AuthenticationType.nucleus.value:
                # Specify the Nucleus access token
                # to let the stream connect to a Nucleus server
                headers["Nucleus-Token"] = websocket.cookies.get(
                    "nucleus_token"
                )

        logger.debug(f"[{nvcf_request_id}] Headers: {headers}")
        async with connect(
            url,
            additional_headers=headers,
            user_agent_header=websocket.headers.get("user-agent"),
        ) as forward_to:
            logger.info(f"[{nvcf_request_id}] Connected.")

            session.status = SessionStatus.active
            await session.save()

            async def consumer():
                """
                Consumes messages from the client and sends them to NVCF.
                """
                try:
                    while True:
                        msg = await websocket.receive_text()
                        await forward_to.send(msg)
                except (ConnectionClosedError, WebSocketDisconnect) as err:
                    nonlocal code, reason
                    code, reason = err.code, err.reason
                    raise err

            async def producer():
                """
                Receives messages from NVCF and sends them to the client.
                """
                try:
                    while True:
                        msg = await forward_to.recv()
                        if isinstance(msg, str):
                            await websocket.send_text(msg)
                        else:
                            await websocket.send_bytes(msg)
                except (ConnectionClosedError, WebSocketDisconnect) as err:
                    nonlocal code, reason
                    code, reason = err.code, err.reason
                    raise err

            # Start consuming and producing client messages in parallel
            consumer_task = asyncio.create_task(consumer())
            producer_task = asyncio.create_task(producer())

            # Wait until any of the task will fail.
            # Closing a WebSocket connection will raise a connection close error
            done, pending = await asyncio.wait(
                [consumer_task, producer_task],
                return_when=asyncio.FIRST_EXCEPTION,
            )

            # Cancel all tasks that didn't raise a close exception
            for task in pending:
                task.cancel()

    except InvalidStatus as error:
        code, reason = 1006, error.response.reason_phrase
        logger.error(f"[{session.id}] Disconnected with invalid status: {error.response.status_code} -- {error.response.body}.\nHeaders:\n{error.response.headers}")
    except WebSocketDisconnect as disconnect:
        # Handle exceptions that can be raised during the handshake
        code, reason = disconnect.code, disconnect.reason
        logger.error(f"[{session.id}] Disconnected with an error: {code} -- {reason}.")
    except TimeoutError:
        code, reason = 3008, "Failed to connect a streaming session with a timeout -- try again later."
        logger.error(f"[{session.id}] Disconnected with a timeout.")
    finally:
        reason_msg = f" ({reason})" if reason else ""
        logger.info(f"[{session.id}] Closed with code {code}{reason_msg}.")

        if not (3000 <= code < 4000):
            # Update the session status and duration, if websocket was not closed by the API.
            # Otherwise, other endpoints have updated the status already.
            session.status = SessionStatus.idle
            session.end_date = datetime.datetime.now(tz=datetime.timezone.utc)
            await session.save()

        # Remove websocket from memory
        session_websockets.pop(session.id, None)
        try:
            # Try to close a client connection if it's not closed yet.
            await websocket.close(code, reason)
        except RuntimeError:
            pass


def construct_nvcf_endpoint(query: QueryParams = None) -> str:
    endpoint = settings.nvcf_signaling_endpoint
    if endpoint.startswith("ws"):
        endpoint = "http" + endpoint[2:]
    return f"{endpoint}/sign_in?{query if query else ''}"


def encode_cookies(cookies: http.cookies.SimpleCookie) -> bytes:
    return get_cookie_values(cookies).encode()


def get_cookie_values(cookies: http.cookies.SimpleCookie) -> str:
    return str(cookies.output(header="")).strip()


def set_session_expired_cookies(function_id: str, function_version_id: str) -> MutableHeaders:
    api_cookies = http.cookies.SimpleCookie()
    api_cookies["nvcf-request-id"] = ""
    api_cookies["nvcf-request-id"]["expires"] = 0

    client_cookies = http.cookies.SimpleCookie()
    client_cookies["nvcf-request-id"] = ""
    client_cookies["nvcf-request-id"]["path"] = f"/stream/{function_id}/{function_version_id}"
    client_cookies["nvcf-request-id"]["expires"] = 0

    headers = MutableHeaders()
    headers.append("set-cookie", get_cookie_values(api_cookies))
    headers.append("set-cookie", get_cookie_values(client_cookies))
    return headers


@router.get(
    "/sessions/",
    dependencies=[Depends(admin_only)],
    description="Returns all streaming sessions.",
    response_model=Page[SessionResponse],
)
async def get_sessions(
    filtered_status: Annotated[SessionStatus, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=5)] = 10,
):
    queryset = SessionModel.all().order_by("-start_date")
    if filtered_status:
        queryset = queryset.filter(status=filtered_status.value.upper())

    total_size = await queryset.count()

    results = await (
        queryset.offset((page - 1) * page_size)
        .limit(page_size)
        .prefetch_related("app")
    )

    items = [
        SessionResponse.model_validate(result, from_attributes=True)
        for result in results
    ]

    return Page(
        items=items,
        page=page,
        page_size=len(items),
        total_pages=ceil(total_size / page_size),
        total_size=total_size,
    )


@router.delete(
    "/sessions/{session_id}/terminate",
    dependencies=[Depends(admin_only)],
    description=(
        "Used by system administrators to terminate the specified session."
    ),
    status_code=status.HTTP_204_NO_CONTENT,
)
async def terminate_session(session_id: str):
    session = await SessionModel.get_or_none(id=session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with id {session_id} was not found.",
        )
    return await end_session(session, reason="Terminated by a system administrator.")
