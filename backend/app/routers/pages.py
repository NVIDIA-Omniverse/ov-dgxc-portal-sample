import logging
from typing import List

from fastapi import APIRouter
from fastapi.params import Depends

from app.auth import authenticated_only, admin_only
from app.models import PublishedPageModel, PublishedPage

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


@router.get(
    "/pages/",
    dependencies=[Depends(authenticated_only)],
    description=(
        "Returns pages and their order for the sidebar menu on the home page."
    ),
    response_model=List[PublishedPage],
)
async def get_pages():
    pages = await PublishedPageModel.all()
    return [
        await PublishedPage.from_tortoise_orm(page)
        for page in pages
    ]


@router.put(
    "/pages/",
    dependencies=[Depends(admin_only)],
    description=(
        "Sets pages and their order for the sidebar menu on the home page."
    ),
    response_model=List[PublishedPage],
)
async def set_pages(pages: List[PublishedPage]):
    await PublishedPageModel.all().delete()

    for page in pages:  # type: PublishedPage
        await PublishedPageModel.update_or_create(
            name=page.name,
            defaults=page.model_dump(exclude_unset=True)
        )
    return await get_pages()

