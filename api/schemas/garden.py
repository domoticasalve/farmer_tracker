from datetime import datetime
from pydantic import BaseModel


class GardenCreate(BaseModel):
    name: str
    description: str | None = None
    lat: float | None = None
    lon: float | None = None
    location_label: str | None = None


class GardenUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    lat: float | None = None
    lon: float | None = None
    location_label: str | None = None


class GardenOut(BaseModel):
    id: int
    name: str
    description: str | None
    lat: float | None
    lon: float | None
    timezone: str | None
    location_label: str | None
    photo_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
