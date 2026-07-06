from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.deal import DealStage
from app.models.user import User
from app.schemas.common import Page
from app.schemas.deal import (
    DealCreate,
    DealRead,
    DealResponsibleUpdate,
    DealStageUpdate,
    DealUpdate,
)
from app.services.deal_service import DealService


router = APIRouter(
    prefix="/deals",
    tags=["deals"],
)


@router.post(
    "",
    response_model=DealRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_deal(
    deal_data: DealCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.create_deal(
        deal_data=deal_data,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=Page[DealRead],
)
async def list_deals(
    workspace_id: Annotated[int, Query(ge=1)],
    deal_stage: DealStage | None = Query(
        default=None,
        alias="stage",
    ),
    client_id: int | None = Query(
        default=None,
        ge=1,
    ),
    responsible_id: int | None = Query(
        default=None,
        ge=1,
    ),
    created_by_id: int | None = Query(
        default=None,
        ge=1,
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    sort_by: Literal[
        "id",
        "created_at",
        "updated_at",
        "title",
        "amount",
        "stage",
    ] = Query(default="id"),
    sort_order: Literal[
        "asc",
        "desc",
    ] = Query(default="asc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.list_deals(
        workspace_id=workspace_id,
        current_user=current_user,
        stage=deal_stage,
        client_id=client_id,
        responsible_id=responsible_id,
        created_by_id=created_by_id,
        search=search,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/{deal_id}",
    response_model=DealRead,
)
async def get_deal(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.get_deal(
        deal_id=deal_id,
        current_user=current_user,
    )


@router.patch(
    "/{deal_id}",
    response_model=DealRead,
)
async def update_deal(
    deal_id: int,
    deal_data: DealUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.update_deal(
        deal_id=deal_id,
        deal_data=deal_data,
        current_user=current_user,
    )


@router.delete(
    "/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_deal(
    deal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    await deal_service.delete_deal(
        deal_id=deal_id,
        current_user=current_user,
    )


@router.patch(
    "/{deal_id}/stage",
    response_model=DealRead,
)
async def update_deal_stage(
    deal_id: int,
    stage_data: DealStageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.update_deal_stage(
        deal_id=deal_id,
        stage_data=stage_data,
        current_user=current_user,
    )


@router.patch(
    "/{deal_id}/responsible",
    response_model=DealRead,
)
async def update_deal_responsible(
    deal_id: int,
    responsible_data: DealResponsibleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deal_service = DealService(db)

    return await deal_service.update_deal_responsible(
        deal_id=deal_id,
        responsible_data=responsible_data,
        current_user=current_user,
    )