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

from enum import Enum
from typing import Any, Type, TypeVar, Generic, Optional, TypeAlias, TypedDict

import pydantic
import tortoise
from pydantic import HttpUrl, BaseModel as PydanticBaseModel, ConfigDict
from pydantic_core import Url
from tortoise import Model, fields
from tortoise.contrib.pydantic import pydantic_model_creator, PydanticModel
from tortoise.fields import Field, OnDelete


def validate_url(value: str):
    try:
        HttpUrl(value)
    except pydantic.ValidationError:
        raise tortoise.exceptions.ValidationError("Value must be a valid URL.")


class UrlField(Field[Url]):
    field_type = Url

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validators.append(validate_url)

    def to_db_value(self, value: Any, instance: Type[Model] | Model) -> str:
        value: Url = super().to_db_value(value, instance)
        return str(value)

    @property
    def SQL_TYPE(self) -> str:
        return "VARCHAR(255)"


PageItem = TypeVar("PageItem", bound=PydanticBaseModel)


class Page(PydanticBaseModel, Generic[PageItem]):
    items: list[PageItem]
    page: int
    page_size: int
    total_size: int
    total_pages: int


NvcfFunctionId: TypeAlias = str
NvcfFunctionVersion: TypeAlias = str


class NvcfFunctionStatus(Enum):
    # Defines statuses retrieved from NVCF for deployed streaming applications.

    # Special status for obtaining all applications
    all = "ALL"

    # The application status cannot be retrieved from NVCF -
    # application does not exist, or status could not be retrieved from NVCF.
    unknown = "UNKNOWN"

    # The application is active and can be launched
    active = "ACTIVE"

    # The application is inactive (disabled) in NVCF
    inactive = "INACTIVE"

    # The application is being deployed
    deploying = "DEPLOYING"

    # The application deployment on NVCF has failed with an error
    error = "ERROR"

    # The application is recycling all pods and
    # currently does not have a minimal amount of active instances
    degrading = "DEGRADING"

    # The application is recycling all active pods
    # but instances does not become active after the deployment
    degraded = "DEGRADED"


class NvcfFunction(TypedDict):
    id: NvcfFunctionId
    versionId: NvcfFunctionVersion
    name: str
    status: NvcfFunctionStatus


NvcfFunctions: TypeAlias = dict[
    tuple[NvcfFunctionId, NvcfFunctionVersion], NvcfFunction
]


class AuthenticationType(str, Enum):
    """Defines what authentication type is required by a published app."""

    # The application does not require passing user authentication
    none = "NONE"

    # The application requires passing the access token received from the IdP
    openid = "OPENID"

    # The application requires passing a Nucleus access token
    nucleus = "NUCLEUS"


class PublishedAppModel(Model):
    id = fields.CharField(primary_key=True, max_length=200)
    slug = fields.CharField(max_length=100)
    function_id = fields.UUIDField()
    function_version_id = fields.UUIDField()
    title = fields.CharField(max_length=100)
    description = fields.TextField()
    version = fields.CharField(max_length=50)
    icon = UrlField(max_length=255)
    page = fields.CharField(max_length=150)
    category = fields.CharField(max_length=150)
    product_area = fields.CharField(max_length=150)
    published_at = fields.DatetimeField(auto_now_add=True, null=True)
    authentication_type = fields.CharField(
        max_length=100,
        default=AuthenticationType.none.value,
        null=True,
    )
    media_server = fields.CharField(max_length=255, default=None, null=True)
    media_port = fields.IntField(null=True, default=None)

    class Meta:
        table = "published_app"
        unique_together = (("function_id", "function_version_id"),)


_PublishedApp: Type[PydanticModel] = pydantic_model_creator(
    PublishedAppModel,
    name="PublishedApp",
    exclude=("id",),
)


class PublishedApp(_PublishedApp):
    media_server: Optional[str] = pydantic.Field(default=None, examples=[None])
    media_port: Optional[int] = pydantic.Field(default=None, examples=[None])


class NvcfDeploymentDetails(PydanticBaseModel):
    """Deployment details retrieved from NVCF for a specific function version."""
    instance_type: Optional[str] = None
    gpu: Optional[str] = None
    cluster: Optional[str] = None
    min_instances: Optional[int] = None
    max_instances: Optional[int] = None
    max_request_concurrency: Optional[int] = None


class PublishedAppResponse(PublishedApp):
    id: str
    status: NvcfFunctionStatus = NvcfFunctionStatus.unknown
    deployment: Optional[NvcfDeploymentDetails] = None


class SessionStatus(str, Enum):
    # The user is starting to the streaming session
    connecting = "CONNECTING"

    # The session has an active user working with the application.
    active = "ACTIVE"

    # The session does not have any active users but still running.
    idle = "IDLE"

    # The session is not stopped and is currently either CONNECTING, ACTIVE or IDLE.
    # Only used for filtering.
    alive = "ALIVE"

    # The session has been explicitly terminated by an end-user or
    # by a system administrator.
    stopped = "STOPPED"

    # The session ended without explicit user action: a connected client
    # disconnected (browser tab closed, connection lost) and the session was
    # cleaned up by the idle/timeout watcher.
    expired = "EXPIRED"

    # The session ended due to an upstream error: NVCF rejected the
    # connection, the streaming application crashed, or the connection to
    # NVCF was closed abnormally.
    failed = "FAILED"


class SessionModel(Model):
    id = fields.CharField(primary_key=True, max_length=200)
    function_id = fields.UUIDField()
    function_version_id = fields.UUIDField()
    nvcf_request_id = fields.CharField(max_length=36, null=True)
    app: fields.ForeignKeyNullableRelation[PublishedAppModel] = (
        fields.ForeignKeyField(
            model_name="models.PublishedAppModel",
            related_name="sessions",
            null=True,
            on_delete=OnDelete.SET_NULL
        )
    )
    app_id: Optional[str]

    user_id = fields.CharField(max_length=200)
    user_name = fields.CharField(max_length=200)
    status = fields.CharField(max_length=50, db_index=True)
    start_date = fields.DatetimeField(auto_now_add=True)
    end_date = fields.DatetimeField(null=True)
    duration = fields.IntField(default=0)
    error = fields.TextField(null=True, default=None)

    class Meta:
        table = "session"


Session: Type[PydanticModel] = pydantic_model_creator(
    SessionModel, name="Session"
)


class SessionApp(PydanticBaseModel):
    id: str
    title: str
    product_area: str
    version: str


class SessionResponse(Session):
    app: Optional[SessionApp] = None


class PublishedPageModel(Model):
    name = fields.CharField(primary_key=True, max_length=150)
    order = fields.SmallIntField(null=True, default=None)

    class Meta:
        table = "published_page"


PublishedPage: Type[PydanticModel] = pydantic_model_creator(
    PublishedPageModel, name="PublishedPage"
)


class McpOAuthClientModel(Model):
    """A dynamically registered MCP OAuth client (RFC 7591)."""

    client_id = fields.CharField(primary_key=True, max_length=128)
    client_info = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "mcp_oauth_client"


class McpAuthTransactionModel(Model):
    """An in-flight brokered login awaiting the identity provider redirect."""

    id = fields.CharField(primary_key=True, max_length=128)
    client_id = fields.CharField(max_length=128)
    redirect_uri = fields.TextField()
    redirect_uri_provided_explicitly = fields.BooleanField()
    code_challenge = fields.CharField(max_length=256)
    scopes = fields.JSONField()
    client_state = fields.TextField(null=True)
    resource = fields.TextField(null=True)
    expires_at = fields.FloatField()

    class Meta:
        table = "mcp_auth_transaction"


class McpUserGrantModel(Model):
    """Shared fields for grants that carry a resolved portal user."""

    client_id = fields.CharField(max_length=128)
    scopes = fields.JSONField()
    expires_at = fields.FloatField()
    subject = fields.CharField(max_length=256, null=True)
    user_id_token = fields.TextField()
    user_access_token = fields.TextField(null=True)
    user_payload = fields.JSONField()

    class Meta:
        abstract = True


class McpAuthCodeModel(McpUserGrantModel):
    """A broker-issued authorization code exchanged for tokens at /token."""

    code = fields.CharField(primary_key=True, max_length=128)
    code_challenge = fields.CharField(max_length=256)
    redirect_uri = fields.TextField()
    redirect_uri_provided_explicitly = fields.BooleanField()
    resource = fields.TextField(null=True)

    class Meta:
        table = "mcp_auth_code"


class McpAccessTokenModel(McpUserGrantModel):
    """A broker-issued access token validated on MCP requests."""

    token = fields.CharField(primary_key=True, max_length=128)

    class Meta:
        table = "mcp_access_token"


class McpRefreshTokenModel(McpUserGrantModel):
    """A broker-issued refresh token exchanged for new tokens."""

    token = fields.CharField(primary_key=True, max_length=128)

    class Meta:
        table = "mcp_refresh_token"