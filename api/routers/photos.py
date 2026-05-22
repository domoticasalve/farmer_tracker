import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from PIL import Image

from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.user import User
from models.garden import Garden
from models.garden_plant import GardenPlant
from models.photo import Photo
from schemas.photo import PhotoOut

router = APIRouter(prefix="/api/garden-plants/{gp_id}/photos", tags=["photos"])


def _assert_ownership(gp_id: int, user: User, db: Session) -> GardenPlant:
    gp = db.get(GardenPlant, gp_id)
    if not gp:
        raise HTTPException(status_code=404, detail="No encontrado")
    garden = db.get(Garden, gp.garden_id)
    if garden.user_id != user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return gp


@router.get("", response_model=list[PhotoOut])
def list_photos(gp_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _assert_ownership(gp_id, user, db)
    return db.query(Photo).filter(Photo.garden_plant_id == gp_id).order_by(Photo.taken_at.desc()).all()


@router.post("", response_model=PhotoOut, status_code=201)
def upload_photo(
    gp_id: int,
    file: UploadFile = File(...),
    task_id: int | None = Form(None),
    caption: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_ownership(gp_id, user, db)

    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Formato no válido. Usa JPG, PNG o WebP")

    content = file.file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Imagen demasiado grande (máx {settings.MAX_UPLOAD_SIZE_MB}MB)")

    filename = f"plant_{gp_id}_{uuid.uuid4().hex[:10]}.webp"
    dest = os.path.join(settings.UPLOAD_DIR, filename)

    from io import BytesIO
    img = Image.open(BytesIO(content))
    img.thumbnail((1600, 1600))
    img.save(dest, "WEBP", quality=85)

    photo = Photo(garden_plant_id=gp_id, task_id=task_id, caption=caption, url=f"/uploads/{filename}")
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=204)
def delete_photo(gp_id: int, photo_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _assert_ownership(gp_id, user, db)
    photo = db.get(Photo, photo_id)
    if not photo or photo.garden_plant_id != gp_id:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    path = os.path.join(settings.UPLOAD_DIR, os.path.basename(photo.url))
    if os.path.exists(path):
        os.remove(path)

    db.delete(photo)
    db.commit()
