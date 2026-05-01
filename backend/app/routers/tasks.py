from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.task import Task, TaskStatus
from ..models.project import ProjectMember
from ..models.user import User
from ..schemas.task import TaskCreate, TaskUpdate, TaskOut
from ..services.auth import get_current_user
from ..websocket.manager import manager

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _require_project_access(project_id: int, user: User, db: Session):
    membership = db.query(ProjectMember).filter_by(project_id=project_id, user_id=user.id).first()
    if not membership and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/", response_model=list[TaskOut])
def list_tasks(
    project_id: int,
    status: Optional[TaskStatus] = None,
    assignee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_project_access(project_id, current_user, db)
    q = db.query(Task).filter(Task.project_id == project_id)
    if status:
        q = q.filter(Task.status == status)
    if assignee_id:
        q = q.filter(Task.assignee_id == assignee_id)
    return q.order_by(Task.status, Task.position).all()


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(task_in: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_project_access(task_in.project_id, current_user, db)
    position = db.query(Task).filter(Task.project_id == task_in.project_id, Task.status == task_in.status).count()
    task = Task(**task_in.model_dump(), created_by_id=current_user.id, position=position)
    db.add(task)
    db.commit()
    db.refresh(task)
    await manager.broadcast_to_project(task.project_id, {"event": "task_created", "task_id": task.id})
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _require_project_access(task.project_id, current_user, db)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _require_project_access(task.project_id, current_user, db)

    updates = task_in.model_dump(exclude_unset=True)
    old_status = task.status
    for field, value in updates.items():
        setattr(task, field, value)

    if "status" in updates and task.status != old_status:
        task.position = db.query(Task).filter(
            Task.project_id == task.project_id,
            Task.status == task.status,
            Task.id != task.id,
        ).count()

    db.commit()
    db.refresh(task)
    await manager.broadcast_to_project(task.project_id, {"event": "task_updated", "task_id": task.id})
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _require_project_access(task.project_id, current_user, db)
    project_id = task.project_id
    db.delete(task)
    db.commit()
    await manager.broadcast_to_project(project_id, {"event": "task_deleted", "task_id": task_id})


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await manager.connect(websocket, project_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
