"""Seed inicial del catálogo de plantas. Ejecutar una vez tras las migraciones."""
from sqlalchemy.orm import Session
from models.plant import PlantCatalogue, PlantStage

PLANTS = [
    {
        "name_es": "Tomate", "name_en": "Tomato", "family": "Solanaceae", "category": "verdura",
        "days_to_harvest": 75, "water_needs_mm_week": 25, "temp_min_c": 10, "temp_max_c": 35, "temp_optimal_c": 22,
        "description": "Fruto muy versátil. Necesita soporte y poda de chupones.",
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Trasplante", "action_type": "TRANSPLANT", "days_from_sowing": 21},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 1, "repeat_every_days": 3},
            {"stage_name": "Abonado", "action_type": "FERTILIZE", "days_from_sowing": 30},
            {"stage_name": "Revisión", "action_type": "CHECK", "days_from_sowing": 45},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 75},
        ],
    },
    {
        "name_es": "Lechuga", "name_en": "Lettuce", "family": "Asteraceae", "category": "verdura",
        "days_to_harvest": 45, "water_needs_mm_week": 20, "temp_min_c": 5, "temp_max_c": 24, "temp_optimal_c": 15,
        "description": "Crece rápido. Sensible al calor excesivo (espiga).",
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 2, "repeat_every_days": 2},
            {"stage_name": "Aclareo", "action_type": "CHECK", "days_from_sowing": 15},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 45},
        ],
    },
    {
        "name_es": "Pimiento", "name_en": "Bell Pepper", "family": "Solanaceae", "category": "verdura",
        "days_to_harvest": 80, "water_needs_mm_week": 22, "temp_min_c": 12, "temp_max_c": 35, "temp_optimal_c": 24,
        "description": "Requiere temperatura cálida y mucho sol.",
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Trasplante", "action_type": "TRANSPLANT", "days_from_sowing": 28},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 1, "repeat_every_days": 4},
            {"stage_name": "Abonado", "action_type": "FERTILIZE", "days_from_sowing": 35},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 80},
        ],
    },
    {
        "name_es": "Zanahoria", "name_en": "Carrot", "family": "Apiaceae", "category": "verdura",
        "days_to_harvest": 70, "water_needs_mm_week": 18, "temp_min_c": 5, "temp_max_c": 27, "temp_optimal_c": 16,
        "description": "Necesita suelo suelto y profundo para buen desarrollo de raíces.",
        "stages": [
            {"stage_name": "Siembra directa", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 2, "repeat_every_days": 4},
            {"stage_name": "Aclareo", "action_type": "CHECK", "days_from_sowing": 20},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 70},
        ],
    },
    {
        "name_es": "Pepino", "name_en": "Cucumber", "family": "Cucurbitaceae", "category": "verdura",
        "days_to_harvest": 55, "water_needs_mm_week": 30, "temp_min_c": 15, "temp_max_c": 38, "temp_optimal_c": 25,
        "description": "Alta demanda de agua. Necesita tutor o guía para trepar.",
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Trasplante", "action_type": "TRANSPLANT", "days_from_sowing": 14},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 1, "repeat_every_days": 2},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 55},
        ],
    },
    {
        "name_es": "Calabacín", "name_en": "Zucchini", "family": "Cucurbitaceae", "category": "verdura",
        "days_to_harvest": 55, "water_needs_mm_week": 28, "temp_min_c": 15, "temp_max_c": 35, "temp_optimal_c": 22,
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 2, "repeat_every_days": 3},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 55},
        ],
    },
    {
        "name_es": "Fresa", "name_en": "Strawberry", "family": "Rosaceae", "category": "fruta",
        "days_to_harvest": 90, "water_needs_mm_week": 20, "temp_min_c": 5, "temp_max_c": 30, "temp_optimal_c": 18,
        "stages": [
            {"stage_name": "Plantación", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 2, "repeat_every_days": 3},
            {"stage_name": "Abonado", "action_type": "FERTILIZE", "days_from_sowing": 30},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 90},
        ],
    },
    {
        "name_es": "Albahaca", "name_en": "Basil", "family": "Lamiaceae", "category": "hierba",
        "days_to_harvest": 30, "water_needs_mm_week": 15, "temp_min_c": 12, "temp_max_c": 35, "temp_optimal_c": 22,
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 2, "repeat_every_days": 3},
            {"stage_name": "Pinzado", "action_type": "CHECK", "days_from_sowing": 25},
            {"stage_name": "Primera cosecha", "action_type": "HARVEST", "days_from_sowing": 30},
        ],
    },
    {
        "name_es": "Cebolla", "name_en": "Onion", "family": "Amaryllidaceae", "category": "verdura",
        "days_to_harvest": 120, "water_needs_mm_week": 15, "temp_min_c": 2, "temp_max_c": 30, "temp_optimal_c": 16,
        "stages": [
            {"stage_name": "Siembra", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 3, "repeat_every_days": 5},
            {"stage_name": "Abonado", "action_type": "FERTILIZE", "days_from_sowing": 40},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 120},
        ],
    },
    {
        "name_es": "Ajo", "name_en": "Garlic", "family": "Amaryllidaceae", "category": "verdura",
        "days_to_harvest": 180, "water_needs_mm_week": 10, "temp_min_c": 0, "temp_max_c": 28, "temp_optimal_c": 15,
        "stages": [
            {"stage_name": "Plantación diente", "action_type": "SOWING", "days_from_sowing": 0},
            {"stage_name": "Riego", "action_type": "WATER", "days_from_sowing": 5, "repeat_every_days": 7},
            {"stage_name": "Cosecha", "action_type": "HARVEST", "days_from_sowing": 180},
        ],
    },
]


def run_seed(db: Session):
    if db.query(PlantCatalogue).count() > 0:
        return  # ya sembrado

    for p in PLANTS:
        stages_data = p.pop("stages", [])
        plant = PlantCatalogue(**p)
        db.add(plant)
        db.flush()
        for s in stages_data:
            db.add(PlantStage(plant_id=plant.id, **s))

    db.commit()
    print(f"Seed completado: {len(PLANTS)} plantas insertadas.")
