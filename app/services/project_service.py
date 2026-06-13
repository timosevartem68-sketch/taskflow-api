from sqlalchemy.ext.asyncio import AsyncSession
from app.core.permissions import ensure_role_allowed
from app.models.project import Project
from app.models.user import User
from app.models.workspace_member import WorkspaceRole
from app.repositories.project_repository import ProjectRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.core.exceptions import NotFoundError, PermissionDeniedError

class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repository = ProjectRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    async def create_project(
        self,
        *,
        project_data: ProjectCreate,
        current_user: User,
    ) -> Project:
        member = await self.workspace_repository.get_member(
            workspace_id=project_data.workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")

        ensure_role_allowed(
            role=member.role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
                WorkspaceRole.MEMBER,
            },
            error_message="У вас нет прав на создание проектов",
        )

        project = await self.project_repository.create(
            workspace_id=project_data.workspace_id,
            name=project_data.name,
            description=project_data.description,
        )

        await self.db.commit()
        await self.db.refresh(project)

        return project

    async def list_projects(
        self,
        *,
        workspace_id: int,
        current_user: User,
    ) -> list[Project]:
        member = await self.workspace_repository.get_member(
            workspace_id=workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому рабочему пространству")

        return await self.project_repository.list_by_workspace(workspace_id)

    async def get_project(
        self,
        *,
        project_id: int,
        current_user: User,
    ) -> Project:
        project = await self.project_repository.get_by_id(project_id)

        if project is None:
            raise NotFoundError("Проект не найден")

        member = await self.workspace_repository.get_member(
            workspace_id=project.workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому проекту")

        return project

    async def update_project(
        self,
        *,
        project_id: int,
        project_data: ProjectUpdate,
        current_user: User,
    ) -> Project:
        project = await self.project_repository.get_by_id(project_id)

        if project is None:
            raise NotFoundError("Проект не найден")

        member = await self.workspace_repository.get_member(
            workspace_id=project.workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому проекту")

        ensure_role_allowed(
        role=member.role,
        allowed_roles={
        WorkspaceRole.OWNER,
        WorkspaceRole.ADMIN,
        WorkspaceRole.MEMBER,
        },
        error_message="У вас нет прав на изменение проектов",
        )

        project = await self.project_repository.update(
            project,
            name=project_data.name,
            description=project_data.description,
        )

        await self.db.commit()
        await self.db.refresh(project)

        return project

    async def delete_project(
        self,
        *,
        project_id: int,
        current_user: User,
    ) -> None:
        project = await self.project_repository.get_by_id(project_id)

        if project is None:
            raise NotFoundError("Проект не найден")

        member = await self.workspace_repository.get_member(
            workspace_id=project.workspace_id,
            user_id=current_user.id,
        )

        if member is None:
            raise PermissionDeniedError("У вас нет доступа к этому проекту")

        ensure_role_allowed(
        role=member.role,
        allowed_roles={
        WorkspaceRole.OWNER,
        WorkspaceRole.ADMIN,
        },
        error_message="You do not have permission to delete projects",
    )

        await self.project_repository.delete(project)

        await self.db.commit()