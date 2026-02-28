from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List

from src.database import init_db, save_analysis, get_recent_history

app = FastAPI(title="Flood Risk Intelligence Engine")

# Initialize SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Add CORS middleware to allow Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow broader connection during local Next.js dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationRequest(BaseModel):
    lat: float
    lng: float

class AnalysisResponse(BaseModel):
    risk_level: str
    past_water_km2: float
    recent_water_km2: float
    water_expansion_km2: float
    expansion_percentage: float
    reasons: List[str]

@app.get("/")
def read_root():
    return {"status": "active", "message": "Climate Risk Engine API is running"}

@app.get("/api/history")
def read_history():
    """Returns the last 10 calculations from the state table"""
    return get_recent_history()

@app.post("/api/analyze-location", response_model=AnalysisResponse)
async def analyze_location(request: LocationRequest):
    lat = request.lat
    lng = request.lng

    # Connect to Google Earth Engine
    try:
        from src.gee_analysis import analyze_point_on_gee
        result = analyze_point_on_gee(lat, lng)
        
        # Save to PS6 required state table
        save_analysis(
            lat=lat, 
            lng=lng, 
            risk_level=result["risk_level"], 
            expansion=result["water_expansion_km2"]
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
