from datetime import datetime, date
from pydantic import BaseModel


class TaskOut(BaseModel):
    id: int
    garden_plant_id: int
    action_type: str
    title: str
    scheduled_date: date
    completed_at: datetime | None
    skipped: bool
    auto_skipped_by_rain: bool
    notes: str | None

    model_config = {"from_attributes": True}


class TaskComplete(BaseModel):
    notes: str | None = None


class TaskSkip(BaseModel):
    notes: str | None = None
