from pathlib import Path
from datetime import date, timedelta
import yaml


def _rolling_windows():
    today = date.today()
    past_start = (today - timedelta(days=365 * 6)).isoformat()
    past_end = (today - timedelta(days=366)).isoformat()
    recent_start = (today - timedelta(days=365)).isoformat()
    recent_end = today.isoformat()
    return past_start, past_end, recent_start, recent_end


def load_config(path=None):
    """Load config.yaml and expose a flat shape used by pipeline modules."""
    config_path = Path(path) if path else Path(__file__).with_name("config.yaml")
    with config_path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    region = raw.get("region", {})
    dates = raw.get("dates", {})
    satellite = raw.get("satellite", {})
    detection = raw.get("detection", {})
    past_dates = dates.get("past", ["auto", "auto"])
    recent_dates = dates.get("recent", ["auto", "auto"])

    default_past_start, default_past_end, default_recent_start, default_recent_end = _rolling_windows()

    past_start = past_dates[0] if past_dates[0] not in ("", None, "auto") else default_past_start
    past_end = past_dates[1] if past_dates[1] not in ("", None, "auto") else default_past_end
    recent_start = recent_dates[0] if recent_dates[0] not in ("", None, "auto") else default_recent_start
    recent_end = recent_dates[1] if recent_dates[1] not in ("", None, "auto") else default_recent_end

    return {
        "region_name": region.get("name", "Unknown"),
        "roi": region.get("roi", []),
        "past_start": past_start,
        "past_end": past_end,
        "recent_start": recent_start,
        "recent_end": recent_end,
        "dataset": satellite.get("dataset", "COPERNICUS/S2_SR_HARMONIZED"),
        "cloud_threshold": satellite.get("cloud_threshold", 80),
        "scale": satellite.get("scale", 30),
        "ndwi_threshold": detection.get("ndwi_threshold", 0.3),
        "pixel_resolution": detection.get("pixel_resolution", 30),
    }


CONFIG = load_config()
