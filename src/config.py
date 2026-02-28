from pathlib import Path
import yaml


def load_config(path=None):
    """Load config.yaml and expose a flat shape used by pipeline modules."""
    config_path = Path(path) if path else Path(__file__).with_name("config.yaml")
    with config_path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    region = raw.get("region", {})
    dates = raw.get("dates", {})
    satellite = raw.get("satellite", {})
    detection = raw.get("detection", {})
    past_dates = dates.get("past", ["", ""])
    recent_dates = dates.get("recent", ["", ""])

    return {
        "region_name": region.get("name", "Unknown"),
        "roi": region.get("roi", []),
        "past_start": past_dates[0],
        "past_end": past_dates[1],
        "recent_start": recent_dates[0],
        "recent_end": recent_dates[1],
        "dataset": satellite.get("dataset", "COPERNICUS/S2_SR_HARMONIZED"),
        "cloud_threshold": satellite.get("cloud_threshold", 80),
        "scale": satellite.get("scale", 30),
        "ndwi_threshold": detection.get("ndwi_threshold", 0.3),
        "pixel_resolution": detection.get("pixel_resolution", 30),
    }


CONFIG = load_config()
