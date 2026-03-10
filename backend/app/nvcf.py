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

import logging
import uuid

import httpx
from asyncache import cached
from cachetools import TTLCache

from app.models import NvcfFunctionStatus, NvcfFunctions, NvcfDeploymentDetails
from app.settings import settings

logger = logging.getLogger(__name__)


nvcf_function_cache = TTLCache(maxsize=1, ttl=settings.nvcf_cache_ttl)
nvcf_deployment_cache = TTLCache(maxsize=128, ttl=settings.nvcf_cache_ttl)


@cached(nvcf_function_cache)
async def get_nvcf_functions() -> NvcfFunctions:
    """
    Calls NVCF Control Plane and returns all cloud functions that
    are currently deployed on NVCF. Results are stored in a dict with
    tuple-keys that include function ID and function version ID and
    values with a dict that store function info.

    This function caches the results for the time configured with
    NVCF_CACHE_TTL environment variable (seconds).
    """
    if not settings.nvcf_api_key:
        logger.error(
            f"Failed to get NVCF functions - API key is not configured."
        )
        return {}

    logger.info("Get fresh status of NVCF functions...")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.nvcf_control_endpoint}/v2/nvcf/functions",
            headers={
                "Authorization": f"Bearer {settings.nvcf_api_key}"
            }
        )
        if response.is_success:
            results = response.json()
            return {
                (function["id"], function["versionId"]): function
                for function in results["functions"]
            }

        logger.error(f"Failed to get NVCF functions: {response.text}")
        return {}


def get_nvcf_function_status(
    functions: NvcfFunctions,
    function_id: str | uuid.UUID,
    function_version_id: str | uuid.UUID
) -> NvcfFunctionStatus:
    """
    Finds the function with the specified ID and version ID and
    returns its status or returns UNKNOWN if the function is not found.

    :param functions: NVCF function received from `get_nvcf_functions` call.
    :param function_id:
    :param function_version_id:
    :return:
    """
    function = functions.get((str(function_id), str(function_version_id)))
    if function:
        return NvcfFunctionStatus(function["status"])
    else:
        return NvcfFunctionStatus.unknown


@cached(nvcf_deployment_cache)
async def get_nvcf_deployment_details(
    function_id: str | uuid.UUID,
    function_version_id: str | uuid.UUID,
) -> NvcfDeploymentDetails | None:
    """
    Calls NGC API to get deployment details for a specific function version.
    Returns None if the details cannot be retrieved.

    This function caches the results for the time configured with
    NVCF_CACHE_TTL environment variable (seconds).
    """
    if not settings.nvcf_api_key:
        logger.error(
            "Failed to get NVCF deployment details - API key is not configured."
        )
        return None

    fid = str(function_id)
    fvid = str(function_version_id)

    logger.info(f"Get fresh deployment details for {fid}/{fvid}...")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.ngc_endpoint}"
            f"/v2/nvcf/deployments/functions/{fid}/versions/{fvid}",
            headers={
                "Authorization": f"Bearer {settings.nvcf_api_key}"
            }
        )
        if response.is_success:
            deployment = response.json().get("deployment", {})
            specs = deployment.get("deploymentSpecifications", [])
            if not specs:
                return NvcfDeploymentDetails()
            spec = specs[0]
            clusters = spec.get("clusters", [])
            return NvcfDeploymentDetails(
                instance_type=spec.get("instanceType"),
                gpu=spec.get("gpu"),
                cluster=clusters[0] if clusters else None,
                min_instances=spec.get("minInstances"),
                max_instances=spec.get("maxInstances"),
                max_request_concurrency=spec.get("maxRequestConcurrency"),
            )

        logger.error(
            f"Failed to get NVCF deployment details for "
            f"{fid}/{fvid}: HTTP {response.status_code} {response.text}"
        )
        return None
