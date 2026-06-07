from app.core.exceptions import ConflictError, NotFoundError, PermissionDeniedError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.permissions import ensure_role_allowed
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate, WorkspaceMemberAdd, WorkspaceMemberUpdate, WorkspaceUpdate


class WorkspaceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.workspace_repository = WorkspaceRepository(db)

    async def create_workspace(
            self,
            *,
            workspace_data: WorkspaceCreate,
            current_user: User,
    ) -> Workspace:
        workspace = await self.workspace_repository.create_workspace(
            name=workspace_data.name,
            owner_id=current_user.id,
        )

        await self.workspace_repository.add_member(
            workspace_id=workspace.id,
            user_id=current_user.id,
            role=WorkspaceRole.OWNER,
        )

        await self.db.commit()
        await self.db.refresh(workspace)

        return workspace

    async def get_workspace_for_user(
            self,
            *,
            workspace_id: int,
            current_user: User,
    ) -> Workspace:
        member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise NotFoundError("Рабочее пространство не найдено")

        return workspace

    async def list_workspaces_for_user(
            self,
            *,
            current_user: User,
    ) -> list[Workspace]:
        return await self.workspace_repository.list_for_user(current_user.id)

    async def update_workspace(
            self,
            *,
            workspace_id: int,
            workspace_data: WorkspaceUpdate,
            current_user: User,
    ) -> Workspace:
        member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")

        ensure_role_allowed(
            role=member.role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
            },
            error_message="У вас нет прав на изменение этого рабочего пространства",
        )

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise NotFoundError("Рабочее пространство не найдено")

        if workspace_data.name is not None:
            workspace.name = workspace_data.name

        await self.db.commit()
        await self.db.refresh(workspace)

        return workspace

    async def add_member(
            self,
            *,
            workspace_id: int,
            member_data: WorkspaceMemberAdd,
            current_user: User,
    ) -> WorkspaceMember:
        current_member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=current_user.id,
        )

        if current_member is None:
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")
        ensure_role_allowed(
            role=current_member.role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
            },
            error_message="У вас нет прав на добавление участников",
        )

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise NotFoundError("Рабочее пространство не найдено")

        existing_member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=member_data.user_id,
        )

        if existing_member is not None:
            raise ConflictError("Пользователь уже добавлен в это рабочее пространство")

        member = await self.workspace_repository.add_member(
            workspace_id=workspace_id,
            user_id=member_data.user_id,
            role=member_data.role,
        )

        await self.db.commit()
        await self.db.refresh(member)

        return member
