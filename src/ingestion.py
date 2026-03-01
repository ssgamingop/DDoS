import os
import ee
import geemap
from .config import CONFIG
from .logging_utils import log_event

def run_ingestion():
    log_event(
        "ingestion",
        "config_loaded",
        region_name=CONFIG["region_name"],
        roi=CONFIG["roi"],
        dataset=CONFIG["dataset"],
        past_start=CONFIG["past_start"],
        past_end=CONFIG["past_end"],
        recent_start=CONFIG["recent_start"],
        recent_end=CONFIG["recent_end"],
        cloud_threshold=CONFIG["cloud_threshold"],
    )

    try:
        project_id = os.environ.get("GEE_PROJECT", "gen-lang-client-0997797287")
        ee.Initialize(project=project_id)
    except Exception as exc:
        log_event("ingestion", "failed", error=str(exc))
        raise

    os.makedirs("data/raw", exist_ok=True)

    region = ee.Geometry.Rectangle(CONFIG["roi"])

    def fetch_image(start_date, end_date):
        collection = (
            ee.ImageCollection(CONFIG["dataset"])
            .filterBounds(region)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", CONFIG["cloud_threshold"]))
        )

        size = collection.size().getInfo()
        if size == 0:
            raise ValueError("No images found")

        image = collection.median().clip(region)
        return image, size

    past_image, past_count = fetch_image(CONFIG["past_start"], CONFIG["past_end"])
    recent_image, recent_count = fetch_image(CONFIG["recent_start"], CONFIG["recent_end"])
    log_event("ingestion", "collections_ready", past_image_count=past_count, recent_image_count=recent_count)

    geemap.ee_export_image(
        past_image.select(["B3", "B8"]),
        filename="data/raw/past_image.tif",
        scale=CONFIG["scale"],
        region=region,
        file_per_band=False
    )
    log_event("ingestion", "past_image_exported", output_path="data/raw/past_image.tif")

    geemap.ee_export_image(
        recent_image.select(["B3", "B8"]),
        filename="data/raw/recent_image.tif",
        scale=CONFIG["scale"],
        region=region,
        file_per_band=False
    )
    log_event("ingestion", "recent_image_exported", output_path="data/raw/recent_image.tif")

    return past_count, recent_count
