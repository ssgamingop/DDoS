from datetime import datetime
import json
import os

def classify_risk(recent_area, percent_increase):

    if recent_area < 1:
        return "LOW"

    if percent_increase > 200:
        return "HIGH"

    if percent_increase > 50:
        return "MODERATE"

    return "LOW"

def run_risk_engine(past_area, recent_area, flood_area, percent_increase):

    risk_level = classify_risk(recent_area, percent_increase)

    report = {
        "region": "Mumbai",
        "past_area_km2": round(past_area,2),
        "recent_area_km2": round(recent_area,2),
        "flood_expansion_km2": round(flood_area,2),
        "percent_increase": round(percent_increase,2),
        "risk_level": risk_level,
        "timestamp": datetime.utcnow().isoformat()
    }

    os.makedirs("output", exist_ok=True)

    with open("output/risk_report.json", "w") as f:
        json.dump(report, f, indent=4)

    return risk_level