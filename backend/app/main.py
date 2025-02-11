import asyncio
import traceback
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from tortoise.contrib.fastapi import RegisterTortoise
from tortoise.exceptions import DoesNotExist, IntegrityError

from app.routers import apps_router, sessions_router
from app.routers.sessions import watch_session_timeout, watch_idle_sessions
from app.settings import settings


@asynccontextmanager
async def configure_api(app: FastAPI):
    settings.listen()

    session_termination_task = None
    session_idle_termination_task = None
    try:
        async with RegisterTortoise(
            app,
            db_url=settings.database_url,
            modules={"models": ["app.models"]},
            generate_schemas=True,
        ):
            session_termination_task = asyncio.create_task(watch_session_timeout())
            session_termination_task.add_done_callback(watcher_task_done)

            session_idle_termination_task = asyncio.create_task(watch_idle_sessions())
            session_idle_termination_task.add_done_callback(watcher_task_done)
            yield
    finally:
        if session_termination_task is not None:
            session_termination_task.cancel()
        if session_idle_termination_task is not None:
            session_idle_termination_task.cancel()
        settings.stop()


def watcher_task_done(task):
    if task.exception():
        traceback.print_exc()


api = FastAPI(
    title="Backend",
    description=(
        "The API for publishing extended metadata for container images."
    ),
    lifespan=configure_api,
    root_path=settings.root_path,
    docs_url="/",
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.exception_handler(DoesNotExist)
async def doesnotexist_exception_handler(request: Request, exc: DoesNotExist):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@api.exception_handler(IntegrityError)
async def integrityerror_exception_handler(
    request: Request, exc: IntegrityError
):
    return JSONResponse(
        status_code=422,
        content={
            "detail": [{"loc": [], "msg": str(exc), "type": "IntegrityError"}]
        },
    )


api.include_router(apps_router)
api.include_router(sessions_router)


def start():
    logging_config = uvicorn.config.LOGGING_CONFIG
    logging_config["loggers"]["uvicorn"]["level"] = "DEBUG"
    logging_config["loggers"]["uvicorn.error"]["level"] = "ERROR"
    logging_config["loggers"]["uvicorn.access"]["level"] = "INFO"

    uvicorn.run(
        "app.main:api",
        host="0.0.0.0",
        port=8000,
        reload=False,
        ws_ping_interval=None,
        ws_ping_timeout=None,
        log_level="info",
        log_config=logging_config,
    )
