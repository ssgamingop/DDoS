import os
import uuid
from typing import List

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.database import init_db, save_analysis, get_recent_history
from src.logging_utils import log_event

app = FastAPI(title="Flood Risk Intelligence Engine")

# Initialize SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    log_event("api", "startup_completed")

# Add CORS middleware to allow Next.js frontend to communicate with this API
origins_env = os.environ.get("ALLOWED_ORIGINS")
if origins_env:
    allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    # sensible local default instead of wildcard to support cookies
    allowed_origins = ["http://localhost:3000"]

allow_creds = False if "*" in allowed_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class AnalysisResponse(BaseModel):
    risk_level: str
    past_water_km2: float
    recent_water_km2: float = 0.0
    water_expansion_km2: float
    expansion_percentage: float
    reasons: List[str]
    elevation_m: float = 0.0
    exposed_population: int = 0
    exposed_builtup_km2: float = 0.0
    coordinates: List[List[List[List[float]]]] = []

@app.get("/")
def read_root():
    log_event("api", "healthcheck")
    return {"status": "active", "message": "Climate Risk Engine API is running"}

@app.get("/api/history")
def read_history():
    """Returns the last 10 calculations from the state table"""
    return get_recent_history()

@app.post("/api/analyze-location", response_model=AnalysisResponse)
async def analyze_location(request: LocationRequest):
    lat = request.lat
    lng = request.lng
    request_id = uuid.uuid4().hex[:12]
    log_event("api", "analysis_requested", request_id=request_id, lat=lat, lng=lng)

    # Connect to Google Earth Engine
    try:
        from src.gee_analysis import analyze_point_on_gee
        result = analyze_point_on_gee(lat, lng, request_id=request_id)
        
        # Save to PS6 required state table
        save_analysis(
            lat=lat, 
            lng=lng, 
            risk_level=result["risk_level"], 
            expansion=result["water_expansion_km2"]
        )
        log_event(
            "api",
            "analysis_completed",
            request_id=request_id,
            lat=lat,
            lng=lng,
            risk_level=result["risk_level"],
            water_expansion_km2=result["water_expansion_km2"],
        )
        
        return result
    except Exception as e:
        log_event("api", "analysis_failed", request_id=request_id, lat=lat, lng=lng, error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed (request_id={request_id})")

if __name__ == "__main__":
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
