import ee
import math
from datetime import datetime

# Initialize Earth Engine globally
try:
    ee.Initialize(project="gen-lang-client-0997797287")
    print("Earth Engine Initialized Successfully in API Backend")
except Exception as e:
    print(f"Failed to initialize Earth Engine: {e}")

# Constants
dataset_str = "COPERNICUS/S2_SR_HARMONIZED"
cloud_thresh = 80
scale = 30
ndwi_thresh = 0.3

# We will define a broader historical baseline from 2020,
# and look for recent observations up through the current year (2026).
PAST_START, PAST_END = '2020-01-01', '2024-12-31'
RECENT_START, RECENT_END = '2025-01-01', '2026-12-31'

def analyze_point_on_gee(lat: float, lng: float):
    """
    Given a lat/lng, returns the risk profile dynamically calculated on GEE servers.
    """
    # 1. Define ROI: 5km radius around the clicked point
    point = ee.Geometry.Point([lng, lat])
    roi = point.buffer(5000) # 5km
    
    def get_water_area(start_date, end_date):
        collection = (ee.ImageCollection(dataset_str)
            .filterBounds(roi)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_thresh)))
            
        # Get median composite
        image = collection.median().clip(roi)
        
        # Calculate NDWI: (Green - NIR) / (Green + NIR)
        # Sentinel-2: B3 is Green, B8 is NIR
        ndwi = image.normalizedDifference(['B3', 'B8'])
        
        # Binary Water Mask
        water_mask = ndwi.gt(ndwi_thresh)
        
        # Multiply by pixel area to calculate spatial extent in m^2
        water_area_img = water_mask.multiply(ee.Image.pixelArea())
        
        # Sum all water pixels
        stats = water_area_img.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=roi,
            scale=scale,
            maxPixels=1e9
        )
        
        # Return area in km^2
        area_m2 = stats.getNumber('nd').getInfo()
        # If no image or data, area might be None type, handle gracefully
        if area_m2 is None:
            return 0.0
        return area_m2 / 1_000_000

    past_water_km2 = get_water_area(PAST_START, PAST_END)
    recent_water_km2 = get_water_area(RECENT_START, RECENT_END)
    
    # 2. Add Risk Intelligence: Elevation Check using SRTM
    # SRTM (Shuttle Radar Topography Mission) gives global elevation
    dem = ee.Image("USGS/SRTMGL1_003")
    elevation_val = dem.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=roi,
        scale=30,
        maxPixels=1e9
    ).getNumber('elevation').getInfo()
    
    if elevation_val is None:
        elevation_val = 0
        
    # 3. Calculate Deltas
    # simple checks to prevent small noise floating inaccuracies
    past_water_km2 = max(0, float(past_water_km2))
    recent_water_km2 = max(0, float(recent_water_km2))
    
    expansion = recent_water_km2 - past_water_km2
    expansion = max(0, expansion) # we only care about floods, not droughts for this risk engine
    
    percent_increase = 0
    if past_water_km2 > 0:
        percent_increase = (expansion / past_water_km2) * 100
    elif past_water_km2 == 0 and expansion > 0:
        percent_increase = 100 # went from completely dry to water
        
    # 4. Determine Risk and Reasons
    risk = "LOW"
    reasons = []
    
    if expansion > 2 and percent_increase > 100:
         risk = "HIGH"
         reasons.append(f"Significant water area expansion detected (+{round(percent_increase, 1)}%) based on Sentinel-2.")
         reasons.append(f"Water surface increased by {round(expansion, 2)} km² across the {round(roi.area().getInfo()/1e6, 2)} km² analysis zone.")
    elif expansion > 0.5 and percent_increase > 25:
         risk = "MODERATE"
         reasons.append(f"Moderate water expansion detected (+{round(percent_increase, 1)}%).")
         reasons.append(f"Water surface increased by {round(expansion, 2)} km².")
    else:
         risk = "LOW"
         if expansion > 0:
             reasons.append(f"Minor / normal water fluctuations observed (+{round(expansion, 2)} km²).")
         else:
             reasons.append("No water expansion detected. Current water levels are at or below historical baselines.")

    # Elevation logic
    if elevation_val < 30 and risk in ["HIGH", "MODERATE"]:
         reasons.append(f"The location is low-lying (Avg Elevation: {round(elevation_val, 1)}m), exacerbating flood risk.")
    elif elevation_val < 30 and risk == "LOW":
         reasons.append(f"The location is low-lying ({round(elevation_val, 1)}m) and generally susceptible to flash floods, but no current anomalies detected.")
         
    return {
        "risk_level": risk,
        "past_water_km2": round(past_water_km2, 3),
        "recent_water_km2": round(recent_water_km2, 3),
        "water_expansion_km2": round(expansion, 3),
        "expansion_percentage": round(percent_increase, 2),
        "reasons": reasons
    }
