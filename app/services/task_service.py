from app.core.permissions import ensure_role_allowed
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.models.workspace_member import WorkspaceRole
from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.common import Page
from app.schemas.task import (
    TaskAssigneeUpdate,
    TaskCreate,
    TaskRead,
    TaskStatusUpdate,
    TaskUpdate,
)


class TaskService:
    def __init__(self, db):
        self.db = db
        self.task_repository = TaskRepository(db)
        self.project_repository = ProjectRepository(db)
        self.workspace_repository = WorkspaceRepository(db)

    async def _get_project_or_raise(self, project_id: int) -> Project:
        project = await self.project_repository.get_by_id(project_id)

        if project is None:
            raise LookupError("Project not found")

        return project

    async def _get_task_or_raise(self, task_id: int) -> Task:
        task = await self.task_repository.get_by_id(task_id)

        if task is None:
            raise LookupError("Task not found")

        return task

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
            raise PermissionError("You do not have access to this workspace")

        return member.role

    @staticmethod
    def _ensure_can_write_tasks(role: WorkspaceRole) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
                WorkspaceRole.MEMBER,
            },
            error_message="You do not have permission to write tasks",
        )

    @staticmethod
    def _ensure_can_delete_tasks(role: WorkspaceRole) -> None:
        ensure_role_allowed(
            role=role,
            allowed_roles={
                WorkspaceRole.OWNER,
                WorkspaceRole.ADMIN,
            },
            error_message="You do not have permission to delete tasks",
        )
    async def create_task(
        self,
        *,
        task_data: TaskCreate,
        current_user: User,
    ) -> Task:
        project = await self._get_project_or_raise(task_data.project_id)

        role = await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_tasks(role)

        task = await self.task_repository.create(
            project_id=task_data.project_id,
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority,
            assignee_id=task_data.assignee_id,
            due_date=task_data.due_date,
            created_by_id=current_user.id,
        )

        await self.db.commit()
        await self.db.refresh(task)

        return task

    async def list_tasks(
        self,
        *,
        current_user: User,
        project_id: int,
        status=None,
        priority=None,
        assignee_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by="id",
        sort_order="asc",
    ) -> Page[TaskRead]:

        project = await self._get_project_or_raise(project_id)

        await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        items, total = await self.task_repository.list(
            project_id=project_id,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            created_by_id=created_by_id,
            search=search,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return Page[TaskRead](
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_task(
        self,
        *,
        task_id: int,
        current_user: User,
    ) -> Task:
        task = await self._get_task_or_raise(task_id)
        project = await self._get_project_or_raise(task.project_id)

        await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        return task

    async def update_task(
        self,
        *,
        task_id: int,
        task_data: TaskUpdate,
        current_user: User,
    ) -> Task:
        task = await self._get_task_or_raise(task_id)
        project = await self._get_project_or_raise(task.project_id)

        role = await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_tasks(role)

        task = await self.task_repository.update(
            task,
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            assignee_id=task_data.assignee_id,
            due_date=task_data.due_date,
        )

        await self.db.commit()
        await self.db.refresh(task)

        return task

    async def update_task_status(
        self,
        *,
        task_id: int,
        status_data: TaskStatusUpdate,
        current_user: User,
    ) -> Task:
        task = await self._get_task_or_raise(task_id)
        project = await self._get_project_or_raise(task.project_id)

        role = await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_tasks(role)

        task = await self.task_repository.update(
            task,
            status=status_data.status,
        )

        await self.db.commit()
        await self.db.refresh(task)

        return task

    async def update_task_assignee(
        self,
        *,
        task_id: int,
        assignee_data: TaskAssigneeUpdate,
        current_user: User,
    ) -> Task:
        task = await self._get_task_or_raise(task_id)
        project = await self._get_project_or_raise(task.project_id)

        role = await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_write_tasks(role)

        task = await self.task_repository.update(
            task,
            assignee_id=assignee_data.assignee_id,
        )

        await self.db.commit()
        await self.db.refresh(task)

        return task

    async def delete_task(
        self,
        *,
        task_id: int,
        current_user: User,
    ) -> None:
        task = await self._get_task_or_raise(task_id)
        project = await self._get_project_or_raise(task.project_id)

        role = await self._get_member_role_or_raise(
            workspace_id=project.workspace_id,
            current_user=current_user,
        )

        self._ensure_can_delete_tasks(role)

        await self.task_repository.delete(task)

        await self.db.commit()