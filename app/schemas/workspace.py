from datetime import datetime

from pydantic import BaseModel, Field

from app.models.workspace_member import WorkspaceRole


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class WorkspaceRead(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class WorkspaceMemberRead(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    role: WorkspaceRole
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class WorkspaceMemberAdd(BaseModel):
    user_id: int
    role: WorkspaceRole = WorkspaceRole.MEMBER


class WorkspaceMemberUpdate(BaseModel):
    role: WorkspaceRole