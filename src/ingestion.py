import ee
import geemap
import os
from .config import CONFIG

def run_ingestion():

    ee.Initialize(project="gen-lang-client-0997797287")

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

    geemap.ee_export_image(
        past_image.select(["B3", "B8"]),
        filename="data/raw/past_image.tif",
        scale=CONFIG["scale"],
        region=region,
        file_per_band=False
    )

    geemap.ee_export_image(
        recent_image.select(["B3", "B8"]),
        filename="data/raw/recent_image.tif",
        scale=CONFIG["scale"],
        region=region,
        file_per_band=False
    )

    return past_count, recent_count