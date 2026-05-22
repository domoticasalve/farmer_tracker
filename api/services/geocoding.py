import httpx
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()


def geocode_address(address: str) -> tuple[float, float] | None:
    """Devuelve (lat, lon) para una dirección usando Nominatim (OSM)."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "FarmerTracker/1.0"}
    try:
        resp = httpx.get(url, params=params, headers=headers, timeout=10)
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None


def resolve_timezone(lat: float, lon: float) -> str | None:
    return _tf.timezone_at(lat=lat, lng=lon)
