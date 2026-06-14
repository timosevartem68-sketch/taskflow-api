from datetime import datetime

from pydantic import BaseModel, Field

from app.models.client import ClientStatus


class ClientCreate(BaseModel):
    workspace_id: int
    full_name: str = Field(min_length=1, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=100)
    status: ClientStatus = ClientStatus.NEW
    note: str | None = None
    responsible_id: int | None = None


class ClientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=100)
    status: ClientStatus | None = None
    note: str | None = None
    responsible_id: int | None = None


class ClientRead(BaseModel):
    id: int
    workspace_id: int
    full_name: str
    company: str | None
    phone: str | None
    email: str | None
    source: str | None
    status: ClientStatus
    note: str | None
    responsible_id: int | None
    created_by_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class ClientStatusUpdate(BaseModel):
    status: ClientStatus


class ClientResponsibleUpdate(BaseModel):
    responsible_id: int | None = None