from sqlalchemy.ext.asyncio import AsyncSession

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
            raise PermissionError("You do not have access to this workspace")

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise LookupError("Workspace not found")

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
            raise PermissionError("You do not have access to this workspace")

        if member.role not in {WorkspaceRole.OWNER, WorkspaceRole.ADMIN}:
            raise PermissionError("You do not have permission to update this workspace")

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise LookupError("Workspace not found")

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
            raise PermissionError("You do not have access to this workspace")

        if current_member.role not in {WorkspaceRole.OWNER, WorkspaceRole.ADMIN}:
            raise PermissionError("You do not have permission to add members")

        workspace = await self.workspace_repository.get_by_id(workspace_id)

        if workspace is None:
            raise LookupError("Workspace not found")

        existing_member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=member_data.user_id,
        )

        if existing_member is not None:
            raise ValueError("User is already a member of this workspace")

        member = await self.workspace_repository.add_member(
            workspace_id=workspace_id,
            user_id=member_data.user_id,
            role=member_data.role,
        )

        await self.db.commit()
        await self.db.refresh(member)

        return member