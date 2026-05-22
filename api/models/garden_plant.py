from datetime import datetime, timezone, date
from sqlalchemy import String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class GardenPlant(Base):
    __tablename__ = "garden_plants"

    id: Mapped[int] = mapped_column(primary_key=True)
    garden_id: Mapped[int] = mapped_column(ForeignKey("gardens.id", ondelete="CASCADE"), index=True)
    plant_id: Mapped[int] = mapped_column(ForeignKey("plant_catalogue.id"), index=True)
    zone_label: Mapped[str | None] = mapped_column(String(100))  # ej: "Zona A", "Bancal 1"
    sowing_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), default="active")  # active|harvested|removed
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    garden: Mapped["Garden"] = relationship(back_populates="garden_plants")
    plant: Mapped["PlantCatalogue"] = relationship(back_populates="garden_plants")
    tasks: Mapped[list["Task"]] = relationship(back_populates="garden_plant", cascade="all, delete-orphan")
    photos: Mapped[list["Photo"]] = relationship(back_populates="garden_plant", cascade="all, delete-orphan")
