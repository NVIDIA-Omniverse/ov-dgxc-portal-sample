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

import asyncio
import logging
import re
from typing import Optional
from urllib.parse import urlparse

from fastapi import FastAPI
from mcp.server.auth.settings import (
    AuthSettings,
    ClientRegistrationOptions,
    RevocationOptions,
)
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import AnyHttpUrl
from tortoise.exceptions import DoesNotExist

from app.mcp.auth import current_user
from app.mcp.oauth import (
    build_provider,
    handle_oauth_callback,
    mcp_issuer_url,
)
from app.models import (
    NvcfFunctionStatus,
    PublishedApp,
    PublishedAppModel,
    PublishedAppResponse,
)
from app.nvcf import (
    get_nvcf_deployment_details,
    get_nvcf_function_status,
    get_nvcf_functions,
    nvcf_deployment_cache,
    nvcf_function_cache,
)
from app.settings import settings

logger = logging.getLogger(__name__)

PLACEHOLDER_ICON = "https://placehold.co/256x256?text=App"

_mcp: Optional[FastMCP] = None


def get_mcp() -> Optional[FastMCP]:
    """Returns the mounted MCP instance, or None when it has not been built."""
    return _mcp


def mount_mcp(api: FastAPI) -> FastMCP:
    """
    Builds the MCP server and mounts it at the host root so the Streamable
    HTTP endpoint and the OAuth protected resource metadata are served at
    `mcp_path` and `/.well-known/oauth-protected-resource{mcp_path}`,
    independent of the backend `/api` root path.
    """
    global _mcp
    if _mcp is None:
        _mcp = build_mcp()
    api.mount("/", _mcp.streamable_http_app())
    return _mcp


def build_mcp() -> FastMCP:
    if settings.unsafe_disable_auth:
        instance = FastMCP(
            "Portal Apps",
            streamable_http_path=settings.mcp_path,
            json_response=True,
            stateless_http=True,
            transport_security=mcp_transport_security(),
        )
    else:
        instance = FastMCP(
            "Portal Apps",
            streamable_http_path=settings.mcp_path,
            json_response=True,
            stateless_http=True,
            transport_security=mcp_transport_security(),
            auth_server_provider=build_provider(),
            auth=AuthSettings(
                issuer_url=AnyHttpUrl(mcp_issuer_url()),
                resource_server_url=AnyHttpUrl(settings.mcp_resource_url),
                required_scopes=settings.mcp_required_scopes or None,
                client_registration_options=ClientRegistrationOptions(
                    enabled=True
                ),
                revocation_options=RevocationOptions(enabled=True),
            ),
        )
        instance.custom_route(settings.mcp_callback_path, methods=["GET"])(
            handle_oauth_callback
        )

    register_tools(instance)
    return instance


def mcp_transport_security() -> TransportSecuritySettings:
    """
    Allows the public resource host through DNS rebinding protection so the
    Streamable HTTP endpoint works behind an ingress, where the Host header is
    the portal hostname rather than localhost.
    """
    parsed = urlparse(settings.mcp_resource_url)
    return TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=[parsed.netloc, f"{parsed.hostname}:*"],
        allowed_origins=[
            f"{parsed.scheme}://{parsed.netloc}",
            f"{parsed.scheme}://{parsed.hostname}:*",
        ],
    )


def register_tools(instance: FastMCP) -> None:
    @instance.tool(
        description="List published streaming applications with their NVCF status."
    )
    async def list_apps(
        status: str = NvcfFunctionStatus.all.value,
        function_id: Optional[str] = None,
        function_version_id: Optional[str] = None,
    ) -> list[dict]:
        try:
            filtered_status = NvcfFunctionStatus(status)
        except ValueError:
            raise ToolError(f"Invalid status: {status}")

        queryset = PublishedAppModel.all()
        if function_id:
            queryset = queryset.filter(function_id=function_id)
        if function_version_id:
            queryset = queryset.filter(function_version_id=function_version_id)

        apps, functions = await asyncio.gather(
            PublishedAppResponse.from_queryset(queryset),
            get_nvcf_functions(),
        )

        result = []
        for app in apps:
            app.status = get_nvcf_function_status(
                functions, app.function_id, app.function_version_id
            )
            if filtered_status in (NvcfFunctionStatus.all, app.status):
                result.append(app.model_dump(mode="json"))
        return result

    @instance.tool(
        description=(
            "Get a published application including NVCF status and deployment "
            "details. Provide app_id, or both function_id and "
            "function_version_id."
        )
    )
    async def get_app(
        app_id: Optional[str] = None,
        function_id: Optional[str] = None,
        function_version_id: Optional[str] = None,
    ) -> dict:
        resolved_id = await resolve_app_id(
            app_id, function_id, function_version_id
        )
        app = await fetch_app(resolved_id)
        app.deployment = await get_nvcf_deployment_details(
            app.function_id, app.function_version_id
        )
        return app.model_dump(mode="json")

    @instance.tool(
        description=(
            "Publish or update a streaming application. Requires portal admin "
            "group membership."
        )
    )
    async def publish_app(
        function_id: str,
        function_version_id: str,
        title: str,
        version: str,
        category: str,
        page: str,
        product_area: str,
        authentication_type: str = "NONE",
        media_server: Optional[str] = None,
        media_port: Optional[int] = None,
        icon: Optional[str] = None,
    ) -> dict:
        await ensure_admin()

        slug = build_slug(title)
        app_id = f"{slug}:{version}"
        app = PublishedApp(
            slug=slug,
            function_id=function_id,
            function_version_id=function_version_id,
            title=title,
            description=title,
            version=version,
            icon=icon or PLACEHOLDER_ICON,
            page=page,
            category=category,
            product_area=product_area,
            authentication_type=authentication_type,
            media_server=media_server,
            media_port=media_port,
        )

        app_model, created = await PublishedAppModel.update_or_create(
            id=app_id, defaults=app.model_dump(exclude_unset=True)
        )
        result = await PublishedAppResponse.from_tortoise_orm(app_model)

        nvcf_function_cache.clear()
        nvcf_deployment_cache.clear()
        functions = await get_nvcf_functions()
        result.status = get_nvcf_function_status(
            functions, app.function_id, app.function_version_id
        )

        payload = result.model_dump(mode="json")
        payload["created"] = created
        payload["icon_placeholder_used"] = icon is None
        return payload

    @instance.tool(
        description=(
            "Remove a published application. Requires portal admin group "
            "membership. Returns a preview unless confirm is true."
        )
    )
    async def remove_app(
        app_id: Optional[str] = None,
        function_id: Optional[str] = None,
        function_version_id: Optional[str] = None,
        confirm: bool = False,
    ) -> dict:
        await ensure_admin()

        resolved_id = await resolve_app_id(
            app_id, function_id, function_version_id
        )
        app = await fetch_app(resolved_id)

        if not confirm:
            return {
                "confirmation_required": True,
                "message": f"Re-run with confirm=true to delete {resolved_id}.",
                "app": app.model_dump(mode="json"),
            }

        deleted_count = await PublishedAppModel.filter(id=resolved_id).delete()
        nvcf_function_cache.clear()
        nvcf_deployment_cache.clear()
        if not deleted_count:
            raise ToolError(f"App {resolved_id} is not found.")

        return {"deleted": True, "id": resolved_id}


async def fetch_app(app_id: str) -> PublishedAppResponse:
    try:
        app, functions = await asyncio.gather(
            PublishedAppResponse.from_queryset_single(
                PublishedAppModel.get(id=app_id)
            ),
            get_nvcf_functions(),
        )
    except DoesNotExist:
        raise ToolError(f"App {app_id} is not found.")

    app.status = get_nvcf_function_status(
        functions, app.function_id, app.function_version_id
    )
    return app


async def resolve_app_id(
    app_id: Optional[str],
    function_id: Optional[str],
    function_version_id: Optional[str],
) -> str:
    if app_id:
        return app_id

    if not (function_id and function_version_id):
        raise ToolError(
            "Provide app_id, or both function_id and function_version_id."
        )

    matches = await PublishedAppModel.filter(
        function_id=function_id, function_version_id=function_version_id
    )
    if not matches:
        raise ToolError("No app matches the provided function identifiers.")
    if len(matches) > 1:
        ids = ", ".join(match.id for match in matches)
        raise ToolError(f"Multiple apps matched: {ids}. Provide an exact app_id.")
    return matches[0].id


async def ensure_admin() -> None:
    if settings.unsafe_disable_auth:
        return

    user = current_user()
    if user is None:
        raise ToolError("Authentication is required for this operation.")
    if not await user.is_admin():
        raise ToolError(
            "This operation requires portal admin group membership."
        )


def build_slug(title: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_-]", "-", title.lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:100]
