import rasterio
import numpy as np
import os
from .config import CONFIG
from .logging_utils import log_event

def compute_ndwi(input_path, output_path):

    with rasterio.open(input_path) as src:
        green = src.read(1).astype(float)
        nir = src.read(2).astype(float)
        profile = src.profile

    denominator = green + nir
    denominator[denominator == 0] = np.nan

    ndwi = (green - nir) / denominator
    ndwi = np.clip(ndwi, -1, 1)

    profile.update(dtype=rasterio.float32, count=1)

    with rasterio.open(output_path, "w", **profile) as dst:
        dst.write(ndwi.astype(rasterio.float32), 1)

    return {
        "min": float(np.nanmin(ndwi)),
        "max": float(np.nanmax(ndwi)),
        "mean": float(np.nanmean(ndwi)),
    }

def run_preprocessing():

    os.makedirs("data/processed", exist_ok=True)
    log_event(
        "preprocessing",
        "started",
        past_input="data/raw/past_image.tif",
        recent_input="data/raw/recent_image.tif",
    )

    past_stats = compute_ndwi("data/raw/past_image.tif", "data/processed/past_ndwi.tif")
    log_event("preprocessing", "past_ndwi_computed", output_path="data/processed/past_ndwi.tif", **past_stats)

    recent_stats = compute_ndwi("data/raw/recent_image.tif", "data/processed/recent_ndwi.tif")
    log_event("preprocessing", "recent_ndwi_computed", output_path="data/processed/recent_ndwi.tif", **recent_stats)
