import logging
import uuid

import httpx
from asyncache import cached
from cachetools import TTLCache

from app.models import NvcfFunctionStatus, NvcfFunctions
from app.settings import settings

logger = logging.getLogger('uvicorn.error')


@cached(TTLCache(maxsize=1, ttl=settings.nvcf_cache_ttl))
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
