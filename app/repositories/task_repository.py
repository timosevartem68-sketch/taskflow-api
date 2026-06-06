from datetime import datetime
from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskPriority, TaskStatus


TaskSortBy = Literal["id", "created_at", "updated_at", "due_date", "priority", "status"]
SortOrder = Literal["asc", "desc"]


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        *,
        project_id: int,
        title: str,
        created_by_id: int,
        description: str | None = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        assignee_id: int | None = None,
        due_date: datetime | None = None,
    ) -> Task:
        task = Task(
            project_id=project_id,
            title=title,
            description=description,
            priority=priority,
            assignee_id=assignee_id,
            created_by_id=created_by_id,
            due_date=due_date,
        )

        self.db.add(task)

        await self.db.flush()
        await self.db.refresh(task)

        return task

    async def get_by_id(self, task_id: int) -> Task | None:
        stmt = select(Task).where(Task.id == task_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        project_id: int | None = None,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        assignee_id: int | None = None,
        created_by_id: int | None = None,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: TaskSortBy = "id",
        sort_order: SortOrder = "asc",
    ) -> tuple[list[Task], int]:
        stmt = select(Task)
        count_stmt = select(func.count()).select_from(Task)

        filters = []

        if project_id is not None:
            filters.append(Task.project_id == project_id)

        if status is not None:
            filters.append(Task.status == status)

        if priority is not None:
            filters.append(Task.priority == priority)

        if assignee_id is not None:
            filters.append(Task.assignee_id == assignee_id)

        if created_by_id is not None:
            filters.append(Task.created_by_id == created_by_id)

        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern),
                )
            )

        if filters:
            stmt = stmt.where(*filters)
            count_stmt = count_stmt.where(*filters)

        sort_column = getattr(Task, sort_by)

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
        task: Task,
        *,
        title: str | None = None,
        description: str | None = None,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        assignee_id: int | None = None,
        due_date: datetime | None = None,
    ) -> Task:
        if title is not None:
            task.title = title

        if description is not None:
            task.description = description

        if status is not None:
            task.status = status

        if priority is not None:
            task.priority = priority

        if assignee_id is not None:
            task.assignee_id = assignee_id

        if due_date is not None:
            task.due_date = due_date

        await self.db.flush()
        await self.db.refresh(task)

        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.flush()