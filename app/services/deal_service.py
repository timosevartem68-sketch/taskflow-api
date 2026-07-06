from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.core.permissions import ensure_role_allowed
from app.models.deal import Deal
from app.models.user import User
from app.models.workspace_member import WorkspaceRole
from app.repositories.client_repository import ClientRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.common import Page
from app.schemas.deal import (
    DealCreate,
    DealRead,
    DealResponsibleUpdate,
    DealStageUpdate,
    DealUpdate,
)


class DealService:
    def __init__(self, db: AsyncSession):
        self.db = db

        self.deal_repository = DealRepository(db)
        self.client_repository = ClientRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    async def _get_deal_or_raise(
        self,
        deal_id: int,
    ) -> Deal:
        deal = await self.deal_repository.get_by_id(deal_id)

        if deal is None:
            raise NotFoundError("Сделка не найдена")

        return deal

    async def _get_member_role_or_raise(
        self,
        *,
        workspace_id: int,
        current_user: User,
    ) -> WorkspaceRole:
        member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError(
                "У вас нет доступа к этому рабочему пространству"
            )

        return member.role

    @staticmethod
    def _ensure_can_write_deals(
        role: WorkspaceRole,
    ) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
                WorkspaceRole.MEMBER,
            },
            error_message=(
                "У вас нет прав на создание или изменение сделок"
            ),
        )

    @staticmethod
    def _ensure_can_delete_deals(
        role: WorkspaceRole,
    ) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
            },
            error_message="У вас нет прав на удаление сделок",
        )

    async def _validate_client(
        self,
        *,
        workspace_id: int,
        client_id: int | None,
    ) -> None:
        if client_id is None:
            return

        client = await self.client_repository.get_by_id(client_id)

        if client is None:
            raise NotFoundError("Клиент не найден")

        if client.workspace_id != workspace_id:
            raise PermissionDeniedError(
                "Клиент принадлежит другому рабочему пространству"
            )

    async def _validate_responsible(
        self,
        *,
        workspace_id: int,
        responsible_id: int | None,
    ) -> None:
        if responsible_id is None:
            return

        member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=responsible_id,
        )

        if member is None:
            raise NotFoundError(
                "Ответственный не является участником рабочего пространства"
            )

    async def create_deal(
        self,
        *,
        deal_data: DealCreate,
        current_user: User,
    ) -> Deal:
        role = await self._get_member_role_or_raise(
            workspace_id=deal_data.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_deals(role)

        await self._validate_client(
            workspace_id=deal_data.workspace_id,
            client_id=deal_data.client_id,
        )

        await self._validate_responsible(
            workspace_id=deal_data.workspace_id,
            responsible_id=deal_data.responsible_id,
        )

        deal = await self.deal_repository.create(
            workspace_id=deal_data.workspace_id,
            client_id=deal_data.client_id,
            title=deal_data.title,
            amount=deal_data.amount,
            stage=deal_data.stage,
            responsible_id=deal_data.responsible_id,
            note=deal_data.note,
            created_by_id=current_user.id,
        )

        await self.db.commit()
        await self.db.refresh(deal)

        return deal

    async def list_deals(
        self,
        *,
        workspace_id: int,
        current_user: User,
        stage=None,
        client_id: int | None = None,
        responsible_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "id",
        sort_order: str = "asc",
    ) -> Page[DealRead]:
        await self._get_member_role_or_raise(
            workspace_id=workspace_id,
            current_user=current_user,
        )

        items, total = await self.deal_repository.list(
            workspace_id=workspace_id,
            stage=stage,
            client_id=client_id,
            responsible_id=responsible_id,
            created_by_id=created_by_id,
            search=search,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return Page[DealRead](
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_deal(
        self,
        *,
        deal_id: int,
        current_user: User,
    ) -> Deal:
        deal = await self._get_deal_or_raise(deal_id)

        await self._get_member_role_or_raise(
            workspace_id=deal.workspace_id,
            current_user=current_user,
        )

        return deal

    async def update_deal(
        self,
        *,
        deal_id: int,
        deal_data: DealUpdate,
        current_user: User,
    ) -> Deal:
        deal = await self._get_deal_or_raise(deal_id)

        role = await self._get_member_role_or_raise(
            workspace_id=deal.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_deals(role)

        update_data = deal_data.model_dump(
            exclude_unset=True,
        )

        if "client_id" in update_data:
            await self._validate_client(
                workspace_id=deal.workspace_id,
                client_id=update_data["client_id"],
            )

        if "responsible_id" in update_data:
            await self._validate_responsible(
                workspace_id=deal.workspace_id,
                responsible_id=update_data["responsible_id"],
            )

        deal = await self.deal_repository.update(
            deal,
            update_data=update_data,
        )

        await self.db.commit()
        await self.db.refresh(deal)

        return deal

    async def update_deal_stage(
        self,
        *,
        deal_id: int,
        stage_data: DealStageUpdate,
        current_user: User,
    ) -> Deal:
        deal = await self._get_deal_or_raise(deal_id)

        role = await self._get_member_role_or_raise(
            workspace_id=deal.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_deals(role)

        deal = await self.deal_repository.update(
            deal,
            update_data={
                "stage": stage_data.stage,
            },
        )

        await self.db.commit()
        await self.db.refresh(deal)

        return deal

    async def update_deal_responsible(
        self,
        *,
        deal_id: int,
        responsible_data: DealResponsibleUpdate,
        current_user: User,
    ) -> Deal:
        deal = await self._get_deal_or_raise(deal_id)

        role = await self._get_member_role_or_raise(
            workspace_id=deal.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_deals(role)

        await self._validate_responsible(
            workspace_id=deal.workspace_id,
            responsible_id=responsible_data.responsible_id,
        )

        deal = await self.deal_repository.update(
            deal,
            update_data={
                "responsible_id": responsible_data.responsible_id,
            },
        )

        await self.db.commit()
        await self.db.refresh(deal)

        return deal

    async def delete_deal(
        self,
        *,
        deal_id: int,
        current_user: User,
    ) -> None:
        deal = await self._get_deal_or_raise(deal_id)

        role = await self._get_member_role_or_raise(
            workspace_id=deal.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_delete_deals(role)

        await self.deal_repository.delete(deal)

        await self.db.commit()