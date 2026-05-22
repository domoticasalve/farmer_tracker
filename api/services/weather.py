import json
from datetime import date, timedelta
import httpx
from sqlalchemy.orm import Session

from models.weather_cache import WeatherCache

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_HOURS = 6


def _location_key(lat: float, lon: float) -> str:
    return f"{round(lat, 2)}:{round(lon, 2)}"


def get_forecast(db: Session, lat: float, lon: float, days: int = 16) -> list[dict]:
    """
    Retorna lista de dicts con datos diarios:
    {date, temp_max, temp_min, precipitation_mm, is_rainy}
    Cachea en BD por CACHE_TTL_HOURS.
    """
    from datetime import datetime, timezone

    key = _location_key(lat, lon)
    today = date.today()

    cached = (
        db.query(WeatherCache)
        .filter(WeatherCache.location_key == key, WeatherCache.forecast_date == today)
        .first()
    )

    if cached:
        age_hours = (datetime.now(timezone.utc) - cached.fetched_at).total_seconds() / 3600
        if age_hours < CACHE_TTL_HOURS:
            return json.loads(cached.data_json)

    data = _fetch_open_meteo(lat, lon, days)

    if cached:
        cached.data_json = json.dumps(data)
        from datetime import datetime, timezone
        cached.fetched_at = datetime.now(timezone.utc)
    else:
        db.add(WeatherCache(location_key=key, forecast_date=today, data_json=json.dumps(data)))
    db.commit()

    return data


def _fetch_open_meteo(lat: float, lon: float, days: int) -> list[dict]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "forecast_days": days,
        "timezone": "auto",
    }
    try:
        resp = httpx.get(OPEN_METEO_URL, params=params, timeout=15)
        resp.raise_for_status()
        raw = resp.json()["daily"]
        result = []
        for i, d in enumerate(raw["time"]):
            precip = raw["precipitation_sum"][i] or 0.0
            result.append({
                "date": d,
                "temp_max": raw["temperature_2m_max"][i],
                "temp_min": raw["temperature_2m_min"][i],
                "precipitation_mm": precip,
                "is_rainy": precip >= 5.0,
            })
        return result
    except Exception:
        return []


def is_frost_risk(forecast: list[dict], target_date: date, threshold_c: float = 2.0) -> bool:
    date_str = target_date.isoformat()
    for day in forecast:
        if day["date"] == date_str:
            return (day["temp_min"] or 99) <= threshold_c
    return False


def will_rain(forecast: list[dict], target_date: date, threshold_mm: float = 5.0) -> bool:
    date_str = target_date.isoformat()
    for day in forecast:
        if day["date"] == date_str:
            return (day["precipitation_mm"] or 0) >= threshold_mm
    return False
