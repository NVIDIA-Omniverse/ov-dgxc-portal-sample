# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import authenticated_only
from app.settings import settings

router = APIRouter()


class DeploymentSettingsResponse(BaseModel):
    max_app_instances_count: int
    session_ttl: int
    session_idle_timeout: int
    session_retention_days: int


@router.get(
    "/deployment/settings",
    dependencies=[Depends(authenticated_only)],
    description="Returns current deployment streaming settings.",
    response_model=DeploymentSettingsResponse,
)
async def get_deployment_settings():
    return DeploymentSettingsResponse(
        max_app_instances_count=settings.max_app_instances_count,
        session_ttl=settings.session_ttl,
        session_idle_timeout=settings.session_idle_timeout,
        session_retention_days=settings.session_retention_days,
    )
