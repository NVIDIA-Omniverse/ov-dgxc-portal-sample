from enum import Enum
from typing import Any, Type, TypeVar, Generic, Optional, TypeAlias, TypedDict

import pydantic
import tortoise
from pydantic import HttpUrl, BaseModel as PydanticBaseModel
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

    # The application requires passing the ID token received from the IdP
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
    image = UrlField(max_length=255)
    icon = UrlField(max_length=255)
    category = fields.CharField(max_length=150)
    product_area = fields.CharField(max_length=150)
    published_at = fields.DatetimeField(auto_now_add=True, null=True)
    authentication_type = fields.CharField(
        max_length=100,
        default=AuthenticationType.none.value,
        null=True,
    )

    class Meta:
        table = "published_app"
        unique_together = (("function_id", "function_version_id"),)


PublishedApp: Type[PydanticModel] = pydantic_model_creator(
    PublishedAppModel, name="PublishedApp", exclude=("id",)
)


class PublishedAppResponse(PublishedApp):
    id: str
    status: NvcfFunctionStatus = NvcfFunctionStatus.unknown


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

    # The session has been stopped by the user or system administrator.
    stopped = "STOPPED"


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
