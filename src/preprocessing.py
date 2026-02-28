import rasterio
import numpy as np
import os
from .config import CONFIG

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

def run_preprocessing():

    os.makedirs("data/processed", exist_ok=True)

    compute_ndwi("data/raw/past_image.tif", "data/processed/past_ndwi.tif")
    compute_ndwi("data/raw/recent_image.tif", "data/processed/recent_ndwi.tif")