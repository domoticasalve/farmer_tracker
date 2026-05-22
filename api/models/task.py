from datetime import datetime, timezone, date
from sqlalchemy import String, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    garden_plant_id: Mapped[int] = mapped_column(ForeignKey("garden_plants.id", ondelete="CASCADE"), index=True)
    action_type: Mapped[str] = mapped_column(String(50))  # SOWING|TRANSPLANT|WATER|FERTILIZE|HARVEST|CHECK
    title: Mapped[str] = mapped_column(String(200))
    scheduled_date: Mapped[date] = mapped_column(Date, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    skipped: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_skipped_by_rain: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    garden_plant: Mapped["GardenPlant"] = relationship(back_populates="tasks")
    photos: Mapped[list["Photo"]] = relationship(back_populates="task")
