import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image

from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.user import User
from models.garden import Garden
from schemas.garden import GardenCreate, GardenUpdate, GardenOut
from services.geocoding import resolve_timezone

router = APIRouter(prefix="/api/gardens", tags=["gardens"])


def _own_garden(garden_id: int, user: User, db: Session) -> Garden:
    garden = db.get(Garden, garden_id)
    if not garden or garden.user_id != user.id:
        raise HTTPException(status_code=404, detail="Huerto no encontrado")
    return garden


def _with_plant_count(garden: Garden) -> GardenOut:
    data = GardenOut.model_validate(garden)
    data.plant_count = len(garden.garden_plants)
    return data


@router.get("", response_model=list[GardenOut])
def list_gardens(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    gardens = (
        db.query(Garden)
        .options(joinedload(Garden.garden_plants))
        .filter(Garden.user_id == user.id)
        .order_by(Garden.created_at)
        .all()
    )
    return [_with_plant_count(g) for g in gardens]


@router.post("", response_model=GardenOut, status_code=201)
def create_garden(data: GardenCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tz = None
    if data.lat and data.lon:
        tz = resolve_timezone(data.lat, data.lon)
    garden = Garden(**data.model_dump(), user_id=user.id, timezone=tz)
    db.add(garden)
    db.commit()
    db.refresh(garden)
    return garden


@router.get("/{garden_id}", response_model=GardenOut)
def get_garden(garden_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _own_garden(garden_id, user, db)


@router.patch("/{garden_id}", response_model=GardenOut)
def update_garden(garden_id: int, data: GardenUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    garden = _own_garden(garden_id, user, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(garden, field, value)
    if data.lat and data.lon:
        garden.timezone = resolve_timezone(data.lat, data.lon)
    db.commit()
    db.refresh(garden)
    return garden


@router.delete("/{garden_id}", status_code=204)
def delete_garden(garden_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    garden = _own_garden(garden_id, user, db)
    db.delete(garden)
    db.commit()


@router.post("/{garden_id}/photo", response_model=GardenOut)
def upload_garden_photo(
    garden_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    garden = _own_garden(garden_id, user, db)
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Formato de imagen no válido")

    filename = f"garden_{garden_id}_{uuid.uuid4().hex[:8]}.webp"
    dest = os.path.join(settings.UPLOAD_DIR, filename)

    img = Image.open(file.file)
    img.thumbnail((1200, 1200))
    img.save(dest, "WEBP", quality=85)

    garden.photo_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(garden)
    return garden
