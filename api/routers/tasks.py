from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.garden import Garden
from models.garden_plant import GardenPlant
from models.task import Task
from schemas.task import TaskOut, TaskComplete, TaskSkip

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _assert_ownership(task: Task, user: User, db: Session):
    gp = db.get(GardenPlant, task.garden_plant_id)
    garden = db.get(Garden, gp.garden_id)
    if garden.user_id != user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")


@router.get("", response_model=list[TaskOut])
def list_tasks(
    garden_id: int | None = Query(None),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    pending_only: bool = Query(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    garden_ids = [g.id for g in db.query(Garden).filter(Garden.user_id == user.id).all()]
    if garden_id:
        if garden_id not in garden_ids:
            raise HTTPException(status_code=404, detail="Huerto no encontrado")
        garden_ids = [garden_id]

    gp_ids = [
        gp.id for gp in db.query(GardenPlant).filter(GardenPlant.garden_id.in_(garden_ids)).all()
    ]

    query = db.query(Task).filter(Task.garden_plant_id.in_(gp_ids))
    if from_date:
        query = query.filter(Task.scheduled_date >= from_date)
    if to_date:
        query = query.filter(Task.scheduled_date <= to_date)
    if pending_only:
        query = query.filter(Task.completed_at.is_(None), Task.skipped.is_(False))

    return query.order_by(Task.scheduled_date).all()


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    data: TaskComplete,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    _assert_ownership(task, user, db)
    task.completed_at = datetime.now(timezone.utc)
    task.skipped = False
    if data.notes:
        task.notes = data.notes
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/uncomplete", response_model=TaskOut)
def uncomplete_task(
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    _assert_ownership(task, user, db)
    task.completed_at = None
    task.skipped = False
    task.notes = None
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/skip", response_model=TaskOut)
def skip_task(
    task_id: int,
    data: TaskSkip,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    _assert_ownership(task, user, db)
    task.skipped = True
    task.completed_at = None
    if data.notes:
        task.notes = data.notes
    db.commit()
    db.refresh(task)
    return task
