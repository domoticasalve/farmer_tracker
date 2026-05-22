from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.plant import PlantCatalogue
from schemas.plant import PlantOut, PlantListItem

router = APIRouter(prefix="/api/plants", tags=["plants"])


@router.get("", response_model=list[PlantListItem])
def list_plants(
    q: str | None = Query(None, description="Buscar por nombre"),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(PlantCatalogue)
    if q:
        query = query.filter(PlantCatalogue.name_es.ilike(f"%{q}%"))
    if category:
        query = query.filter(PlantCatalogue.category == category)
    return query.order_by(PlantCatalogue.name_es).all()


@router.get("/{plant_id}", response_model=PlantOut)
def get_plant(plant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    plant = db.get(PlantCatalogue, plant_id)
    if not plant:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Planta no encontrada")
    return plant
