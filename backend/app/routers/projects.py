from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.project import Project, ProjectMember, ProjectRole
from ..models.user import User
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, ProjectMemberOut, AddMemberRequest
from ..services.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

ROLE_ORDER = {ProjectRole.member: 0, ProjectRole.admin: 1, ProjectRole.owner: 2}


def get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def check_access(project_id: int, user: User, db: Session, min_role: ProjectRole = ProjectRole.member) -> ProjectMember | None:
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id,
    ).first()
    if not membership and user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    if membership and ROLE_ORDER.get(membership.role, -1) < ROLE_ORDER[min_role] and user.role != "admin":
        raise HTTPException(status_code=403, detail="Insufficient project role")
    return membership


@router.get("", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(Project).all()
    project_ids = [m.project_id for m in current_user.project_memberships]
    return db.query(Project).filter(Project.id.in_(project_ids)).all()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(**project_in.model_dump())
    db.add(project)
    db.flush()
    db.add(ProjectMember(project_id=project.id, user_id=current_user.id, role=ProjectRole.owner))
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    check_access(project_id, current_user, db)
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    check_access(project_id, current_user, db, min_role=ProjectRole.admin)
    for field, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = get_project_or_404(project_id, db)
    check_access(project_id, current_user, db, min_role=ProjectRole.owner)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=ProjectMemberOut, status_code=status.HTTP_201_CREATED)
def add_member(project_id: int, req: AddMemberRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    get_project_or_404(project_id, db)
    check_access(project_id, current_user, db, min_role=ProjectRole.admin)
    if not db.get(User, req.user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if db.query(ProjectMember).filter_by(project_id=project_id, user_id=req.user_id).first():
        raise HTTPException(status_code=400, detail="User is already a member")
    member = ProjectMember(project_id=project_id, user_id=req.user_id, role=req.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_access(project_id, current_user, db, min_role=ProjectRole.admin)
    member = db.query(ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == ProjectRole.owner:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")
    db.delete(member)
    db.commit()
