from datetime import datetime
from typing import List
from pydantic import BaseModel, Field
from ..models.project import ProjectRole
from .user import UserOut


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    color: str = "#6366f1"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    color: str | None = None


class ProjectMemberOut(BaseModel):
    id: int
    user: UserOut
    role: ProjectRole
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    members: List[ProjectMemberOut] = []

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
    role: ProjectRole = ProjectRole.member
