from sqlalchemy import String, Float, Integer, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class PlantCatalogue(Base):
    __tablename__ = "plant_catalogue"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_es: Mapped[str] = mapped_column(String(100), index=True)
    name_en: Mapped[str | None] = mapped_column(String(100))
    family: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(50))  # verdura, fruta, hierba, etc.
    days_to_harvest: Mapped[int | None] = mapped_column(Integer)
    water_needs_mm_week: Mapped[float | None] = mapped_column(Float)
    temp_min_c: Mapped[float | None] = mapped_column(Float)
    temp_max_c: Mapped[float | None] = mapped_column(Float)
    temp_optimal_c: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    companion_plants: Mapped[str | None] = mapped_column(Text)  # JSON string de IDs
    incompatible_plants: Mapped[str | None] = mapped_column(Text)  # JSON string de IDs

    stages: Mapped[list["PlantStage"]] = relationship(back_populates="plant", cascade="all, delete-orphan")
    garden_plants: Mapped[list["GardenPlant"]] = relationship(back_populates="plant")


class PlantStage(Base):
    __tablename__ = "plant_stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    plant_id: Mapped[int] = mapped_column(Integer, index=True)
    stage_name: Mapped[str] = mapped_column(String(100))
    action_type: Mapped[str] = mapped_column(String(50))  # SOWING|TRANSPLANT|WATER|FERTILIZE|HARVEST|CHECK
    days_from_sowing: Mapped[int] = mapped_column(Integer)
    repeat_every_days: Mapped[int | None] = mapped_column(Integer)  # para riegos repetitivos
    description: Mapped[str | None] = mapped_column(Text)

    plant: Mapped["PlantCatalogue"] = relationship(back_populates="stages")
