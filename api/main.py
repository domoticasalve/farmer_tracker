from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from core.config import settings
from core.database import engine, SessionLocal
import models  # noqa: F401 — registra todos los modelos en Base
from core.database import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from services.seed_plants import run_seed
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Farmer Tracker API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT != "production" else [settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from routers import auth, gardens, plants, garden_plants, tasks, photos

app.include_router(auth.router)
app.include_router(gardens.router)
app.include_router(plants.router)
app.include_router(garden_plants.router)
app.include_router(tasks.router)
app.include_router(photos.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
