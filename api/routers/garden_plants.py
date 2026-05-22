from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.garden import Garden
from models.garden_plant import GardenPlant
from schemas.garden_plant import GardenPlantCreate, GardenPlantUpdate, GardenPlantOut
from services.calendar_engine import generate_tasks_for_plant

router = APIRouter(prefix="/api/gardens/{garden_id}/plants", tags=["garden-plants"])


def _own_garden(garden_id: int, user: User, db: Session) -> Garden:
    garden = db.get(Garden, garden_id)
    if not garden or garden.user_id != user.id:
        raise HTTPException(status_code=404, detail="Huerto no encontrado")
    return garden


@router.get("", response_model=list[GardenPlantOut])
def list_garden_plants(garden_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _own_garden(garden_id, user, db)
    return (
        db.query(GardenPlant)
        .options(joinedload(GardenPlant.plant))
        .filter(GardenPlant.garden_id == garden_id)
        .order_by(GardenPlant.created_at)
        .all()
    )


@router.post("", response_model=GardenPlantOut, status_code=201)
def add_plant_to_garden(
    garden_id: int,
    data: GardenPlantCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    garden = _own_garden(garden_id, user, db)
    gp = GardenPlant(**data.model_dump(), garden_id=garden_id)
    db.add(gp)
    db.flush()

    if data.sowing_date:
        generate_tasks_for_plant(db, gp, garden)

    db.commit()
    db.refresh(gp)
    return gp


@router.patch("/{gp_id}", response_model=GardenPlantOut)
def update_garden_plant(
    garden_id: int,
    gp_id: int,
    data: GardenPlantUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _own_garden(garden_id, user, db)
    gp = db.get(GardenPlant, gp_id)
    if not gp or gp.garden_id != garden_id:
        raise HTTPException(status_code=404, detail="Planta no encontrada en el huerto")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(gp, field, value)
    db.commit()
    db.refresh(gp)
    return gp


@router.delete("/{gp_id}", status_code=204)
def remove_plant_from_garden(
    garden_id: int,
    gp_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _own_garden(garden_id, user, db)
    gp = db.get(GardenPlant, gp_id)
    if not gp or gp.garden_id != garden_id:
        raise HTTPException(status_code=404, detail="Planta no encontrada")
    db.delete(gp)
    db.commit()
