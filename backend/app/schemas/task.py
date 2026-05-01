from datetime import datetime
from pydantic import BaseModel, Field
from ..models.task import TaskStatus, TaskPriority
from .user import UserOut


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: datetime | None = None
    assignee_id: int | None = None


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    assignee_id: int | None = None
    position: int | None = None


class TaskOut(TaskBase):
    id: int
    position: int
    project_id: int
    assignee: UserOut | None = None
    created_by: UserOut | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
