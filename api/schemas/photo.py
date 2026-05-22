from datetime import datetime
from pydantic import BaseModel


class PhotoOut(BaseModel):
    id: int
    garden_plant_id: int
    task_id: int | None
    url: str
    caption: str | None
    taken_at: datetime

    model_config = {"from_attributes": True}
