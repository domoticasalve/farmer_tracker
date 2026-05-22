from datetime import datetime, date
from pydantic import BaseModel
from schemas.plant import PlantListItem


class GardenPlantCreate(BaseModel):
    plant_id: int
    zone_label: str | None = None
    sowing_date: date | None = None
    notes: str | None = None


class GardenPlantUpdate(BaseModel):
    zone_label: str | None = None
    sowing_date: date | None = None
    status: str | None = None
    notes: str | None = None


class GardenPlantOut(BaseModel):
    id: int
    garden_id: int
    plant_id: int
    plant: PlantListItem
    zone_label: str | None
    sowing_date: date | None
    status: str
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
