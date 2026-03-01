from src.ingestion import run_ingestion
from src.preprocessing import run_preprocessing
from src.detection import run_detection
from src.risk_engine import run_risk_engine
from src.logging_utils import log_event
from src.gee_analysis import assert_gee_ready

def main():
    log_event("pipeline", "started")

    try:
        assert_gee_ready()
        print("Running ingestion...")
        log_event("ingestion", "started")
        past_count, recent_count = run_ingestion()
        log_event("ingestion", "completed", past_image_count=past_count, recent_image_count=recent_count)

        print("Running preprocessing...")
        log_event("preprocessing", "started")
        run_preprocessing()
        log_event("preprocessing", "completed")

        print("Running detection...")
        log_event("detection", "started")
        past_area, recent_area, flood_area, percent_increase = run_detection()
        log_event(
            "detection",
            "completed",
            past_area_km2=round(past_area, 4),
            recent_area_km2=round(recent_area, 4),
            flood_expansion_km2=round(flood_area, 4),
            percent_increase=round(percent_increase, 2),
        )

        print("Running risk engine...")
        log_event("risk_engine", "started")
        risk_level = run_risk_engine(past_area, recent_area, flood_area, percent_increase)
        log_event("risk_engine", "completed", risk_level=risk_level)

        print("Final Risk Level:", risk_level)
        log_event("pipeline", "completed", final_risk_level=risk_level)
    except Exception as exc:
        log_event("pipeline", "failed", error=str(exc))
        raise

if __name__ == "__main__":
    main()
