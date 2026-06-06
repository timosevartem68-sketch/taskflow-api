from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        workspace_id: int,
        name: str,
        description: str | None = None,
    ) -> Project:
        project = Project(
            workspace_id=workspace_id,
            name=name,
            description=description,
        )

        self.db.add(project)

        await self.db.flush()
        await self.db.refresh(project)

        return project

    async def get_by_id(self, project_id: int) -> Project | None:
        stmt = select(Project).where(Project.id == project_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_workspace(self, workspace_id: int) -> list[Project]:
        stmt = (
            select(Project)
            .where(Project.workspace_id == workspace_id)
            .order_by(Project.id)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self,
        project: Project,
        *,
        name: str | None = None,
        description: str | None = None,
    ) -> Project:
        if name is not None:
            project.name = name

        if description is not None:
            project.description = description

        await self.db.flush()
        await self.db.refresh(project)

        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.flush()