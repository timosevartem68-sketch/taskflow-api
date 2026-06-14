from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, ClientStatus


ClientSortBy = Literal["id", "created_at", "updated_at", "full_name", "company", "status"]
SortOrder = Literal["asc", "desc"]


class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        workspace_id: int,
        full_name: str,
        created_by_id: int,
        company: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        source: str | None = None,
        status: ClientStatus = ClientStatus.NEW,
        note: str | None = None,
        responsible_id: int | None = None,
    ) -> Client:
        client = Client(
            workspace_id=workspace_id,
            full_name=full_name,
            company=company,
            phone=phone,
            email=email,
            source=source,
            status=status,
            note=note,
            responsible_id=responsible_id,
            created_by_id=created_by_id,
        )

        self.db.add(client)

        await self.db.flush()
        await self.db.refresh(client)

        return client

    async def get_by_id(self, client_id: int) -> Client | None:
        stmt = select(Client).where(Client.id == client_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        workspace_id: int,
        status: ClientStatus | None = None,
        responsible_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: ClientSortBy = "id",
        sort_order: SortOrder = "asc",
    ) -> tuple[list[Client], int]:
        stmt = select(Client)
        count_stmt = select(func.count()).select_from(Client)

        filters = [Client.workspace_id == workspace_id]

        if status is not None:
            filters.append(Client.status == status)

        if responsible_id is not None:
            filters.append(Client.responsible_id == responsible_id)

        if created_by_id is not None:
            filters.append(Client.created_by_id == created_by_id)

        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Client.full_name.ilike(search_pattern),
                    Client.company.ilike(search_pattern),
                    Client.phone.ilike(search_pattern),
                    Client.email.ilike(search_pattern),
                    Client.source.ilike(search_pattern),
                    Client.note.ilike(search_pattern),
                )
            )

        stmt = stmt.where(*filters)
        count_stmt = count_stmt.where(*filters)

        sort_column = getattr(Client, sort_by)

        if sort_order == "desc":
            stmt = stmt.order_by(sort_column.desc())
        else:
            stmt = stmt.order_by(sort_column.asc())

        stmt = stmt.limit(limit).offset(offset)

        items_result = await self.db.execute(stmt)
        total_result = await self.db.execute(count_stmt)

        items = list(items_result.scalars().all())
        total = total_result.scalar_one()

        return items, total

    async def update(
        self,
        client: Client,
        *,
        update_data: dict,
    ) -> Client:
        for field_name, field_value in update_data.items():
            setattr(client, field_name, field_value)

        await self.db.flush()
        await self.db.refresh(client)

        return client

    async def delete(self, client: Client) -> None:
        await self.db.delete(client)
        await self.db.flush()