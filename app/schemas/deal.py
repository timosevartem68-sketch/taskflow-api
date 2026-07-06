from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.deal import DealStage


class DealCreate(BaseModel):
    workspace_id: int = Field(ge=1)
    client_id: int | None = Field(default=None, ge=1)
    title: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    stage: DealStage = DealStage.NEW
    responsible_id: int | None = Field(default=None, ge=1)
    note: str | None = None


class DealUpdate(BaseModel):
    client_id: int | None = Field(default=None, ge=1)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, ge=0)
    stage: DealStage | None = None
    responsible_id: int | None = Field(default=None, ge=1)
    note: str | None = None


class DealRead(BaseModel):
    id: int
    workspace_id: int
    client_id: int | None
    title: str
    amount: Decimal
    stage: DealStage
    responsible_id: int | None
    note: str | None
    created_by_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class DealStageUpdate(BaseModel):
    stage: DealStage


class DealResponsibleUpdate(BaseModel):
    responsible_id: int | None = Field(default=None, ge=1)