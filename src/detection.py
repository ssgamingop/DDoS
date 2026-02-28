import rasterio
import numpy as np
from scipy.ndimage import binary_opening, binary_closing
from .config import CONFIG

def run_detection():

    with rasterio.open("data/processed/past_ndwi.tif") as src:
        past_ndwi = src.read(1)
        profile = src.profile

    with rasterio.open("data/processed/recent_ndwi.tif") as src:
        recent_ndwi = src.read(1)

    threshold = CONFIG["ndwi_threshold"]

    past_water = past_ndwi > threshold
    recent_water = recent_ndwi > threshold

    structure = np.ones((3,3))
    past_clean = binary_closing(binary_opening(past_water, structure), structure)
    recent_clean = binary_closing(binary_opening(recent_water, structure), structure)

    flood_expansion = np.logical_and(recent_clean, np.logical_not(past_clean))

    pixel_area = (CONFIG["pixel_resolution"]**2) / 1_000_000

    past_area = np.sum(past_clean) * pixel_area
    recent_area = np.sum(recent_clean) * pixel_area
    flood_area = np.sum(flood_expansion) * pixel_area

    percent_increase = ((recent_area - past_area) / past_area) * 100 if past_area != 0 else 0

    profile.update(dtype=rasterio.uint8, count=1)

    with rasterio.open("data/processed/flood_expansion.tif", "w", **profile) as dst:
        dst.write(flood_expansion.astype(rasterio.uint8), 1)

    return past_area, recent_area, flood_area, percent_increase