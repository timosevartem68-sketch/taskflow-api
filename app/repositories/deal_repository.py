from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal, DealStage


DealSortBy = Literal[
    "id",
    "created_at",
    "updated_at",
    "title",
    "amount",
    "stage",
]

SortOrder = Literal["asc", "desc"]


class DealRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        workspace_id: int,
        title: str,
        created_by_id: int,
        client_id: int | None = None,
        amount=0,
        stage: DealStage = DealStage.NEW,
        responsible_id: int | None = None,
        note: str | None = None,
    ) -> Deal:
        deal = Deal(
            workspace_id=workspace_id,
            client_id=client_id,
            title=title,
            amount=amount,
            stage=stage,
            responsible_id=responsible_id,
            note=note,
            created_by_id=created_by_id,
        )

        self.db.add(deal)

        await self.db.flush()
        await self.db.refresh(deal)

        return deal

    async def get_by_id(self, deal_id: int) -> Deal | None:
        stmt = select(Deal).where(
            Deal.id == deal_id,
        )

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        workspace_id: int,
        stage: DealStage | None = None,
        client_id: int | None = None,
        responsible_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: DealSortBy = "id",
        sort_order: SortOrder = "asc",
    ) -> tuple[list[Deal], int]:
        stmt = select(Deal)
        count_stmt = select(func.count()).select_from(Deal)

        filters = [
            Deal.workspace_id == workspace_id,
        ]

        if stage is not None:
            filters.append(
                Deal.stage == stage,
            )

        if client_id is not None:
            filters.append(
                Deal.client_id == client_id,
            )

        if responsible_id is not None:
            filters.append(
                Deal.responsible_id == responsible_id,
            )

        if created_by_id is not None:
            filters.append(
                Deal.created_by_id == created_by_id,
            )

        if search:
            search_pattern = f"%{search}%"

            filters.append(
                or_(
                    Deal.title.ilike(search_pattern),
                    Deal.note.ilike(search_pattern),
                )
            )

        stmt = stmt.where(*filters)
        count_stmt = count_stmt.where(*filters)

        sort_column = getattr(
            Deal,
            sort_by,
        )

        if sort_order == "desc":
            stmt = stmt.order_by(
                sort_column.desc(),
            )
        else:
            stmt = stmt.order_by(
                sort_column.asc(),
            )

        stmt = stmt.limit(limit).offset(offset)

        items_result = await self.db.execute(stmt)
        total_result = await self.db.execute(count_stmt)

        items = list(
            items_result.scalars().all()
        )

        total = total_result.scalar_one()

        return items, total

    async def update(
        self,
        deal: Deal,
        *,
        update_data: dict,
    ) -> Deal:
        for field_name, field_value in update_data.items():
            setattr(
                deal,
                field_name,
                field_value,
            )

        await self.db.flush()
        await self.db.refresh(deal)

        return deal

    async def delete(
        self,
        deal: Deal,
    ) -> None:
        await self.db.delete(deal)
        await self.db.flush()