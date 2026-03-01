from datetime import datetime
import json
import os
from .logging_utils import log_event

def classify_risk(flood_expansion_km2, percent_increase):
    # Same hybrid thresholds used by the live API path.
    if flood_expansion_km2 >= 20 or (flood_expansion_km2 >= 5 and percent_increase >= 50):
        return "HIGH"
    if flood_expansion_km2 >= 5 or (flood_expansion_km2 >= 1 and percent_increase >= 25):
        return "MODERATE"
    return "LOW"

def run_risk_engine(past_area, recent_area, flood_area, percent_increase):

    risk_level = classify_risk(flood_area, percent_increase)

    reliability = ""
    if past_area < 0.1:
        reliability = "Percent change suppressed: historical water area <0.1 km²; classification based on absolute expansion."
        percent_increase = 0.0

    report = {
        "region": "Mumbai",
        "past_area_km2": round(past_area,2),
        "recent_area_km2": round(recent_area,2),
        "flood_expansion_km2": round(flood_area,2),
        "percent_increase": round(percent_increase,2),
        "risk_level": risk_level,
        "timestamp": datetime.utcnow().isoformat(),
        "reliability_note": reliability,
    }

    os.makedirs("output", exist_ok=True)

    with open("output/risk_report.json", "w") as f:
        json.dump(report, f, indent=4)

    log_event(
        "risk_engine",
        "report_written",
        output_path="output/risk_report.json",
        risk_level=risk_level,
        past_area_km2=report["past_area_km2"],
        recent_area_km2=report["recent_area_km2"],
        flood_expansion_km2=report["flood_expansion_km2"],
        percent_increase=report["percent_increase"],
    )

    return risk_level
