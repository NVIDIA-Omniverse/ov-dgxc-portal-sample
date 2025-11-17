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

