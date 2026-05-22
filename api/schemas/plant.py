from pydantic import BaseModel


class PlantStageOut(BaseModel):
    id: int
    stage_name: str
    action_type: str
    days_from_sowing: int
    repeat_every_days: int | None
    description: str | None

    model_config = {"from_attributes": True}


class PlantOut(BaseModel):
    id: int
    name_es: str
    name_en: str | None
    family: str | None
    category: str | None
    days_to_harvest: int | None
    water_needs_mm_week: float | None
    temp_min_c: float | None
    temp_max_c: float | None
    temp_optimal_c: float | None
    description: str | None
    image_url: str | None
    stages: list[PlantStageOut] = []

    model_config = {"from_attributes": True}


class PlantListItem(BaseModel):
    id: int
    name_es: str
    name_en: str | None
    category: str | None
    image_url: str | None

    model_config = {"from_attributes": True}
