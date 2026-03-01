import ee
from datetime import date, timedelta

from .logging_utils import log_event

# Initialize Earth Engine globally
try:
    ee.Initialize(project="gen-lang-client-0997797287")
    print("Earth Engine Initialized Successfully in API Backend")
    log_event("gee", "initialized", project_id="gen-lang-client-0997797287")
except Exception as e:
    print(f"Failed to initialize Earth Engine: {e}")
    log_event("gee", "init_failed", error=str(e), project_id="gen-lang-client-0997797287")

# Constants
dataset_str = "COPERNICUS/S2_SR_HARMONIZED"
cloud_thresh = 30
scale = 30
water_index_thresh = 0.15
min_significant_expansion_km2 = 0.05

# Keep periods relative to "today" to avoid stale/future windows.
today_utc = date.today()
PAST_START = (today_utc - timedelta(days=365 * 6)).isoformat()
PAST_END = (today_utc - timedelta(days=366)).isoformat()
RECENT_START = (today_utc - timedelta(days=365)).isoformat()
RECENT_END = today_utc.isoformat()


def _mask_sentinel2_quality(image: ee.Image) -> ee.Image:
    """Mask cloud and cloud-shadow classes from Sentinel-2 SCL band."""
    scl = image.select("SCL")
    valid_pixels = (
        scl.neq(3)   # cloud shadow
        .And(scl.neq(8))   # cloud medium probability
        .And(scl.neq(9))   # cloud high probability
        .And(scl.neq(10))  # thin cirrus
        .And(scl.neq(11))  # snow/ice
    )
    return image.updateMask(valid_pixels)


def _classify_risk(expansion_km2: float, percent_increase: float) -> str:
    """
    Hybrid thresholding:
    - absolute expansion prevents large-area events being marked LOW,
    - percent increase keeps sensitivity to sharp growth.
    """
    if expansion_km2 >= 20 or (expansion_km2 >= 5 and percent_increase >= 50):
        return "HIGH"
    if expansion_km2 >= 5 or (expansion_km2 >= 1 and percent_increase >= 25):
        return "MODERATE"
    return "LOW"


def analyze_point_on_gee(lat: float, lng: float, request_id: str = ""):
    """
    Given a lat/lng, returns the risk profile dynamically calculated on GEE servers.
    """
    log_event(
        "gee",
        "analysis_started",
        request_id=request_id,
        lat=lat,
        lng=lng,
        past_start=PAST_START,
        past_end=PAST_END,
        recent_start=RECENT_START,
        recent_end=RECENT_END,
        cloud_threshold=cloud_thresh,
        water_index_threshold=water_index_thresh,
    )

    try:
        # 1. Define ROI: 10km radius around the clicked point
        point = ee.Geometry.Point([lng, lat])
        roi = point.buffer(10000)  # 10km

        def get_water_data(start_date, end_date):
            collection = (
                ee.ImageCollection(dataset_str)
                .filterBounds(roi)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_thresh))
                .map(_mask_sentinel2_quality)
            )

            scene_count = collection.size().getInfo()
            if scene_count == 0:
                empty_mask = ee.Image.constant(0).rename("water_mask").clip(roi)
                return 0.0, empty_mask, scene_count

            # Get median composite
            image = collection.median().clip(roi)

            # MNDWI is less prone to built-up false positives than NDWI.
            water_index = image.normalizedDifference(["B3", "B11"]).rename("water_index")

            # Binary Water Mask
            water_mask = water_index.gt(water_index_thresh).rename("water_mask")

            # Multiply by pixel area to calculate spatial extent in m^2
            water_area_img = water_mask.multiply(ee.Image.pixelArea()).rename("water_area")

            # Sum all water pixels
            stats = water_area_img.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=roi,
                scale=scale,
                maxPixels=1e9,
                bestEffort=True,
                tileScale=8,
            )

            # Return area in km^2
            area_m2 = stats.getNumber("water_area").getInfo()
            if area_m2 is None:
                area_m2 = 0.0
            return (area_m2 / 1_000_000), water_mask, scene_count

        past_water_km2, past_mask, past_scene_count = get_water_data(PAST_START, PAST_END)
        recent_water_km2, recent_mask, recent_scene_count = get_water_data(RECENT_START, RECENT_END)

        # Determine exact new flood expansion mask
        expansion_mask = recent_mask.And(past_mask.Not()).selfMask()

        # Real World Population Extraction (CIESIN/GPWv411)
        try:
            pop_2020 = (
                ee.ImageCollection("CIESIN/GPWv411/GPW_Population_Count")
                .filterDate("2020-01-01", "2020-12-31")
                .first()
            )
            exposed_pop_img = pop_2020.multiply(expansion_mask)
            exposed_pop_raw = exposed_pop_img.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=roi,
                scale=1000,
                maxPixels=1e9,
                bestEffort=True,
                tileScale=8,
            ).getNumber("population_count").getInfo()
            exposed_pop = int(max(0, round(float(exposed_pop_raw or 0.0))))
        except Exception:
            exposed_pop = 0

        # Real Infrastructure / Built-up Area Extraction (ESA/WorldCover/v200 class 50)
        try:
            worldcover = ee.ImageCollection("ESA/WorldCover/v200").first()
            builtup_mask = worldcover.eq(50)
            exposed_builtup_mask = builtup_mask.multiply(expansion_mask)
            exposed_builtup_area = (
                exposed_builtup_mask.multiply(ee.Image.pixelArea())
                .reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=roi,
                    scale=30,
                    maxPixels=1e9,
                    bestEffort=True,
                    tileScale=8,
                )
                .getNumber("Map")
                .getInfo()
            )
            if exposed_builtup_area is None:
                exposed_builtup_area = 0.0
        except Exception:
            exposed_builtup_area = 0.0

        exposed_builtup_km2 = exposed_builtup_area / 1_000_000

        # 2. Add Risk Intelligence: Elevation Check using SRTM
        dem = ee.Image("USGS/SRTMGL1_003")
        elevation_val = dem.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=roi,
            scale=30,
            maxPixels=1e9,
            bestEffort=True,
            tileScale=8,
        ).getNumber("elevation").getInfo()

        if elevation_val is None:
            elevation_val = 0

        # 3. Calculate Deltas and filter micro-noise
        past_water_km2 = max(0, float(past_water_km2))
        recent_water_km2 = max(0, float(recent_water_km2))
        raw_expansion = max(0.0, recent_water_km2 - past_water_km2)
        expansion = 0.0 if raw_expansion < min_significant_expansion_km2 else raw_expansion

        percent_increase = 0.0
        if expansion == 0:
            percent_increase = 0.0
        elif past_water_km2 > 0:
            percent_increase = (expansion / past_water_km2) * 100
        else:
            percent_increase = 100.0  # went from completely dry to water

        # 4. Determine Risk and Reasons
        risk = _classify_risk(expansion, percent_increase)
        reasons = []

        if risk == "HIGH":
            reasons.append(f"Large water expansion detected (+{round(percent_increase, 1)}%).")
            reasons.append(
                f"Water surface increased by {round(expansion, 2)} km² across the {round(roi.area().getInfo()/1e6, 2)} km² analysis zone."
            )
        elif risk == "MODERATE":
            reasons.append(f"Moderate expansion detected (+{round(percent_increase, 1)}%).")
            reasons.append(f"Water surface increased by {round(expansion, 2)} km².")
        else:
            if expansion > 0:
                reasons.append(f"Minor / normal water fluctuations observed (+{round(expansion, 2)} km²).")
            else:
                reasons.append("No water expansion detected. Current water levels are at or below historical baselines.")

        # Elevation logic
        if elevation_val < 30 and risk in ["HIGH", "MODERATE"]:
            reasons.append(f"The location is low-lying (Avg Elevation: {round(elevation_val, 1)}m), exacerbating flood risk.")
        elif elevation_val < 30 and risk == "LOW":
            reasons.append(
                f"The location is low-lying ({round(elevation_val, 1)}m) and generally susceptible to flash floods, but no current anomalies detected."
            )

        # Vectorize expansion mask for frontend rendering
        extracted_coords = []
        try:
            if expansion > 0.0:
                vectors = expansion_mask.reduceToVectors(
                    geometry=roi,
                    scale=100,  # 100m to avoid huge payload size and timeout
                    geometryType='polygon',
                    eightConnected=False,
                    maxPixels=1e9,
                    crs='EPSG:4326',
                    bestEffort=True
                )
                geojson = vectors.getInfo()
                if geojson and 'features' in geojson and len(geojson['features']) > 0:
                    for feature in geojson['features']:
                        geom = feature.get('geometry', {})
                        poly_type = geom.get('type')
                        poly_coords = geom.get('coordinates', [])
                        if poly_type == 'Polygon' and len(poly_coords) > 0:
                            extracted_coords.append(poly_coords)
                        elif poly_type == 'MultiPolygon' and len(poly_coords) > 0:
                            for c in poly_coords:
                                extracted_coords.append(c)
        except Exception as e:
            print(f"Error vectorizing mask: {e}")
            pass

        result = {
            "risk_level": risk,
            "past_water_km2": round(past_water_km2, 3),
            "recent_water_km2": round(recent_water_km2, 3),
            "water_expansion_km2": round(expansion, 3),
            "expansion_percentage": round(percent_increase, 2),
            "reasons": reasons,
            "elevation_m": round(float(elevation_val), 1),
            "exposed_population": exposed_pop,
            "exposed_builtup_km2": round(exposed_builtup_km2, 3),
            "coordinates": extracted_coords,
        }
        log_event(
            "gee",
            "analysis_completed",
            request_id=request_id,
            risk_level=result["risk_level"],
            past_water_km2=result["past_water_km2"],
            recent_water_km2=result["recent_water_km2"],
            water_expansion_km2=result["water_expansion_km2"],
            expansion_percentage=result["expansion_percentage"],
            elevation_m=round(float(elevation_val), 2),
            past_scene_count=past_scene_count,
            recent_scene_count=recent_scene_count,
            cloud_threshold=cloud_thresh,
            water_index_threshold=water_index_thresh,
        )
        return result
    except Exception as exc:
        log_event("gee", "analysis_failed", request_id=request_id, lat=lat, lng=lng, error=str(exc))
        raise
