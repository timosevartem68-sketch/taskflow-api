from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember, WorkspaceRole


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_workspace(
            self,
            *,
            name: str,
            owner_id: int,
    ) -> Workspace:
        workspace = Workspace(
            name=name,
            owner_id=owner_id,
        )

        self.db.add(workspace)

        await self.db.flush()
        await self.db.refresh(workspace)

        return workspace

    async def get_by_id(self, workspace_id: int) -> Workspace | None:
        stmt = select(Workspace).where(Workspace.id == workspace_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: int) -> list[Workspace]:
        stmt = (
            select(Workspace)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Workspace.id)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def add_member(
            self,
            *,
            workspace_id: int,
            user_id: int,
            role: WorkspaceRole,
    ) -> WorkspaceMember:
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
        )

        self.db.add(member)

        await self.db.flush()
        await self.db.refresh(member)

        return member

    async def get_member(
            self,
            *,
            workspace_id: int,
            user_id: int,
    ) -> WorkspaceMember | None:
        stmt = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_members(
            self,
            *,
            workspace_id: int,
    ) -> list[dict]:
        stmt = (
            select(
                WorkspaceMember.id,
                WorkspaceMember.workspace_id,
                WorkspaceMember.user_id,
                WorkspaceMember.role,
                WorkspaceMember.created_at,
                User.full_name,
                User.email,
            )
            .join(
                User,
                User.id == WorkspaceMember.user_id,
            )
            .where(
                WorkspaceMember.workspace_id == workspace_id,
            )
            .order_by(
                WorkspaceMember.created_at,
                WorkspaceMember.id,
            )
        )

        result = await self.db.execute(stmt)

        return [
            dict(row._mapping)
            for row in result.all()
        ]
