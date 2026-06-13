from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService


router = APIRouter(prefix="/projects", tags=["projects"])


@router.post(
    "",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_service = ProjectService(db)

    return await project_service.create_project(
        project_data=project_data,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=list[ProjectRead],
)
async def list_projects(
    workspace_id: int = Query(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_service = ProjectService(db)

    return await project_service.list_projects(
        workspace_id=workspace_id,
        current_user=current_user,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectRead,
)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_service = ProjectService(db)

    return await project_service.get_project(
        project_id=project_id,
        current_user=current_user,
    )


@router.patch(
    "/{project_id}",
    response_model=ProjectRead,
)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_service = ProjectService(db)

    return await project_service.update_project(
        project_id=project_id,
        project_data=project_data,
        current_user=current_user,
    )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_service = ProjectService(db)

    await project_service.delete_project(
        project_id=project_id,
        current_user=current_user,
    )