from datetime import date, timedelta
from sqlalchemy.orm import Session

from models.garden import Garden
from models.garden_plant import GardenPlant
from models.plant import PlantCatalogue, PlantStage
from models.task import Task
from services.weather import get_forecast, will_rain, is_frost_risk

ACTION_LABELS = {
    "SOWING": "Sembrar",
    "TRANSPLANT": "Trasplantar",
    "WATER": "Regar",
    "FERTILIZE": "Abonar",
    "HARVEST": "Cosechar",
    "CHECK": "Revisar",
}


def generate_tasks_for_plant(db: Session, gp: GardenPlant, garden: Garden) -> list[Task]:
    """
    Genera las tareas del ciclo completo de una planta a partir de su fecha de siembra.
    Si el huerto tiene coordenadas, ajusta riegos según previsión meteorológica.
    """
    plant: PlantCatalogue = db.get(PlantCatalogue, gp.plant_id)
    stages: list[PlantStage] = (
        db.query(PlantStage).filter(PlantStage.plant_id == gp.plant_id).order_by(PlantStage.days_from_sowing).all()
    )

    if not stages:
        stages = _default_stages(plant)

    sowing = gp.sowing_date
    forecast = []
    if garden.lat and garden.lon:
        forecast = get_forecast(db, garden.lat, garden.lon)

    tasks = []
    for stage in stages:
        if stage.repeat_every_days:
            tasks += _expand_recurring(stage, sowing, plant, forecast, garden)
        else:
            task = _make_task(stage, sowing, plant, forecast, garden)
            if task:
                tasks.append(task)

    for t in tasks:
        db.add(t)
        t.garden_plant_id = gp.id

    return tasks


def _make_task(stage: PlantStage, sowing: date, plant: PlantCatalogue, forecast: list, garden: Garden) -> Task | None:
    task_date = sowing + timedelta(days=stage.days_from_sowing)
    label = ACTION_LABELS.get(stage.action_type, stage.action_type)
    title = f"{label} — {plant.name_es}"

    auto_skip = False
    if stage.action_type == "WATER" and forecast:
        auto_skip = will_rain(forecast, task_date)

    if stage.action_type == "SOWING" and forecast and plant.temp_min_c:
        if is_frost_risk(forecast, task_date, threshold_c=plant.temp_min_c):
            task_date = _find_safe_date(task_date, forecast, plant.temp_min_c)

    return Task(
        action_type=stage.action_type,
        title=title,
        scheduled_date=task_date,
        skipped=auto_skip,
        auto_skipped_by_rain=auto_skip,
    )


def _expand_recurring(stage: PlantStage, sowing: date, plant: PlantCatalogue, forecast: list, garden: Garden) -> list[Task]:
    tasks = []
    start = sowing + timedelta(days=stage.days_from_sowing)
    end = sowing + timedelta(days=plant.days_to_harvest or 90)
    current = start
    label = ACTION_LABELS.get(stage.action_type, stage.action_type)

    while current <= end:
        auto_skip = stage.action_type == "WATER" and forecast and will_rain(forecast, current)
        tasks.append(Task(
            action_type=stage.action_type,
            title=f"{label} — {plant.name_es}",
            scheduled_date=current,
            skipped=auto_skip,
            auto_skipped_by_rain=auto_skip,
        ))
        current += timedelta(days=stage.repeat_every_days)

    return tasks


def _find_safe_date(from_date: date, forecast: list, temp_min: float) -> date:
    for i in range(1, 8):
        candidate = from_date + timedelta(days=i)
        if not is_frost_risk(forecast, candidate, temp_min):
            return candidate
    return from_date + timedelta(days=7)


def _default_stages(plant: PlantCatalogue) -> list:
    """Etapas genéricas cuando la planta no tiene stages definidos en BD."""
    from types import SimpleNamespace

    days = plant.days_to_harvest or 60
    return [
        SimpleNamespace(action_type="SOWING", days_from_sowing=0, repeat_every_days=None),
        SimpleNamespace(action_type="WATER", days_from_sowing=3, repeat_every_days=3),
        SimpleNamespace(action_type="FERTILIZE", days_from_sowing=21, repeat_every_days=None),
        SimpleNamespace(action_type="CHECK", days_from_sowing=30, repeat_every_days=None),
        SimpleNamespace(action_type="HARVEST", days_from_sowing=days, repeat_every_days=None),
    ]


def refresh_weather_adjustments(db: Session, gp: GardenPlant, garden: Garden):
    """Re-evalúa las tareas de riego pendientes con la previsión actualizada."""
    if not garden.lat or not garden.lon:
        return

    forecast = get_forecast(db, garden.lat, garden.lon)
    today = date.today()

    pending_waters = (
        db.query(Task)
        .filter(
            Task.garden_plant_id == gp.id,
            Task.action_type == "WATER",
            Task.scheduled_date >= today,
            Task.completed_at.is_(None),
        )
        .all()
    )

    for task in pending_waters:
        raining = will_rain(forecast, task.scheduled_date)
        task.auto_skipped_by_rain = raining
        if raining:
            task.skipped = True
        elif task.skipped and task.auto_skipped_by_rain:
            task.skipped = False

    db.commit()
