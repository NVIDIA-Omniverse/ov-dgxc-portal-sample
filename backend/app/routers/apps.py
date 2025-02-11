import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from starlette import status
from starlette.responses import Response

from app.auth import admin_only, authenticated_only
from app.models import (
    PublishedAppResponse, PublishedAppModel, PublishedApp, NvcfFunctionStatus
)
from app.nvcf import get_nvcf_functions, get_nvcf_function_status

router = APIRouter()
logger = logging.getLogger('uvicorn.error')


@router.get(
    "/apps/",
    dependencies=[
        Depends(authenticated_only)
    ],
    description="Returns all published applications.",
    response_model=list[PublishedAppResponse],
)
async def get_apps(
    filtered_status: Annotated[
        NvcfFunctionStatus, Query(alias="status")
    ] = NvcfFunctionStatus.all,

    function_id: Annotated[str, Query()] = None,
    function_version_id: Annotated[str, Query()] = None,
):
    queryset = PublishedAppModel.all()
    if function_id:
        queryset = queryset.filter(function_id=function_id)
    if function_version_id:
        queryset = queryset.filter(function_version_id=function_version_id)

    (apps, functions) = await asyncio.gather(
        # Get applications from the database
        PublishedAppResponse.from_queryset(queryset),

        # Get statuses of deployed NVCF functions
        get_nvcf_functions()
    )

    result = []
    for app in apps:
        # For each application in the database,
        # find a corresponding NVCF function and populate the app status
        app.status = get_nvcf_function_status(
            functions,
            app.function_id,
            app.function_version_id
        )
        if filtered_status in (NvcfFunctionStatus.all, app.status):
            result.append(app)

    return result


@router.get(
    "/apps/{app_id:path}",
    dependencies=[
        Depends(authenticated_only)
    ],
    description=(
        "Returns the specified published application or HTTP404 "
        "if the specified app is not found. "
    ),
    response_model=PublishedAppResponse,
)
async def get_app_info(app_id: str):
    app_model = PublishedAppModel.get(id=app_id)

    (app, functions) = await asyncio.gather(
        # Get application from the database.
        # If it does not exist, raises an exception that triggers 404 error
        PublishedAppResponse.from_queryset_single(app_model),

        # Get statuses of deployed NVCF functions
        get_nvcf_functions()
    )

    # Find a corresponding NVCF function and populate the app status
    app.status = get_nvcf_function_status(
        functions,
        app.function_id,
        app.function_version_id
    )
    return app


@router.put(
    "/apps/{app_id:path}",
    dependencies=[
        Depends(admin_only),
    ],
    description=(
        "Creates or updates the specified published application. "
        "Can only be used by a system administrator."
    ),
    response_model=PublishedAppResponse,
)
async def publish_app(app_id: str, app: PublishedApp):
    if not app_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="`app_id` must be specified in the URL.",
        )

    app_model, created = await PublishedAppModel.update_or_create(
        id=app_id, defaults=app.model_dump(exclude_unset=True)
    )

    result = await PublishedAppResponse.from_tortoise_orm(app_model)
    functions = await get_nvcf_functions()

    result.status = get_nvcf_function_status(
        functions,
        app.function_id,
        app.function_version_id
    )

    return Response(
        status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        content=result.model_dump_json(),
        media_type="application/json",
    )


@router.delete(
    "/apps/{app_id:path}",
    dependencies=[
        Depends(admin_only),
    ],
    description=(
        "Deletes the specified published application. "
        "Can only be used by a system administrator."
    ),
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_app(app_id: str):
    if not app_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="`app_id` must be specified in the URL.",
        )

    deleted_count = await PublishedAppModel.filter(id=app_id).delete()
    if not deleted_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"App {app_id} is not found.",
        )
