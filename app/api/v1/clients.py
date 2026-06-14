from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.client import ClientStatus
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientRead,
    ClientResponsibleUpdate,
    ClientStatusUpdate,
    ClientUpdate,
)
from app.schemas.common import Page
from app.services.client_service import ClientService


router = APIRouter(prefix="/clients", tags=["clients"])


@router.post(
    "",
    response_model=ClientRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.create_client(
        client_data=client_data,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=Page[ClientRead],
)
async def list_clients(
    workspace_id: Annotated[int, Query(ge=1)],
    client_status: ClientStatus | None = Query(default=None, alias="status"),
    responsible_id: int | None = Query(default=None, ge=1),
    created_by_id: int | None = Query(default=None, ge=1),
    search: str | None = Query(default=None, min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="id"),
    sort_order: str = Query(default="asc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.list_clients(
        current_user=current_user,
        workspace_id=workspace_id,
        status=client_status,
        responsible_id=responsible_id,
        created_by_id=created_by_id,
        search=search,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/{client_id}",
    response_model=ClientRead,
)
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.get_client(
        client_id=client_id,
        current_user=current_user,
    )


@router.patch(
    "/{client_id}",
    response_model=ClientRead,
)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.update_client(
        client_id=client_id,
        client_data=client_data,
        current_user=current_user,
    )


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    await client_service.delete_client(
        client_id=client_id,
        current_user=current_user,
    )


@router.patch(
    "/{client_id}/status",
    response_model=ClientRead,
)
async def update_client_status(
    client_id: int,
    status_data: ClientStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.update_client_status(
        client_id=client_id,
        status_data=status_data,
        current_user=current_user,
    )


@router.patch(
    "/{client_id}/responsible",
    response_model=ClientRead,
)
async def update_client_responsible(
    client_id: int,
    responsible_data: ClientResponsibleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_service = ClientService(db)

    return await client_service.update_client_responsible(
        client_id=client_id,
        responsible_data=responsible_data,
        current_user=current_user,
    )