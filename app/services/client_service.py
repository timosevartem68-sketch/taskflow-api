from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.core.permissions import ensure_role_allowed
from app.models.client import Client
from app.models.user import User
from app.models.workspace_member import WorkspaceRole
from app.repositories.client_repository import ClientRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.client import (
    ClientCreate,
    ClientRead,
    ClientResponsibleUpdate,
    ClientStatusUpdate,
    ClientUpdate,
)
from app.schemas.common import Page


class ClientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_repository = ClientRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    async def _get_client_or_raise(self, client_id: int) -> Client:
        client = await self.client_repository.get_by_id(client_id)

        if client is None:
            raise NotFoundError("Клиент не найден")

        return client

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
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")

        return member.role

    @staticmethod
    def _ensure_can_write_clients(role: WorkspaceRole) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
                WorkspaceRole.MEMBER,
            },
            error_message="У вас нет прав на создание или изменение клиентов",
        )

    @staticmethod
    def _ensure_can_delete_clients(role: WorkspaceRole) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
            },
            error_message="У вас нет прав на удаление клиентов",
        )

    async def create_client(
        self,
        *,
        client_data: ClientCreate,
        current_user: User,
    ) -> Client:
        role = await self._get_member_role_or_raise(
            workspace_id=client_data.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_clients(role)

        client = await self.client_repository.create(
            workspace_id=client_data.workspace_id,
            full_name=client_data.full_name,
            company=client_data.company,
            phone=client_data.phone,
            email=client_data.email,
            source=client_data.source,
            status=client_data.status,
            note=client_data.note,
            responsible_id=client_data.responsible_id,
            created_by_id=current_user.id,
        )

        await self.db.commit()
        await self.db.refresh(client)

        return client

    async def list_clients(
        self,
        *,
        current_user: User,
        workspace_id: int,
        status=None,
        responsible_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "id",
        sort_order: str = "asc",
    ) -> Page[ClientRead]:
        await self._get_member_role_or_raise(
            workspace_id=workspace_id,
            current_user=current_user,
        )

        items, total = await self.client_repository.list(
            workspace_id=workspace_id,
            status=status,
            responsible_id=responsible_id,
            created_by_id=created_by_id,
            search=search,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return Page[ClientRead](
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_client(
        self,
        *,
        client_id: int,
        current_user: User,
    ) -> Client:
        client = await self._get_client_or_raise(client_id)

        await self._get_member_role_or_raise(
            workspace_id=client.workspace_id,
            current_user=current_user,
        )

        return client

    async def update_client(
        self,
        *,
        client_id: int,
        client_data: ClientUpdate,
        current_user: User,
    ) -> Client:
        client = await self._get_client_or_raise(client_id)

        role = await self._get_member_role_or_raise(
            workspace_id=client.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_clients(role)

        update_data = client_data.model_dump(exclude_unset=True)

        client = await self.client_repository.update(
            client,
            update_data=update_data,
        )

        await self.db.commit()
        await self.db.refresh(client)

        return client

    async def update_client_status(
        self,
        *,
        client_id: int,
        status_data: ClientStatusUpdate,
        current_user: User,
    ) -> Client:
        client = await self._get_client_or_raise(client_id)

        role = await self._get_member_role_or_raise(
            workspace_id=client.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_clients(role)

        client = await self.client_repository.update(
            client,
            update_data={"status": status_data.status},
        )

        await self.db.commit()
        await self.db.refresh(client)

        return client

    async def update_client_responsible(
        self,
        *,
        client_id: int,
        responsible_data: ClientResponsibleUpdate,
        current_user: User,
    ) -> Client:
        client = await self._get_client_or_raise(client_id)

        role = await self._get_member_role_or_raise(
            workspace_id=client.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_clients(role)

        client = await self.client_repository.update(
            client,
            update_data={"responsible_id": responsible_data.responsible_id},
        )

        await self.db.commit()
        await self.db.refresh(client)

        return client

    async def delete_client(
        self,
        *,
        client_id: int,
        current_user: User,
    ) -> None:
        client = await self._get_client_or_raise(client_id)

        role = await self._get_member_role_or_raise(
            workspace_id=client.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_delete_clients(role)

        await self.client_repository.delete(client)

        await self.db.commit()