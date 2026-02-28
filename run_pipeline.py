from src.ingestion import run_ingestion
from src.preprocessing import run_preprocessing
from src.detection import run_detection
from src.risk_engine import run_risk_engine

def main():

    print("Running ingestion...")
    past_count, recent_count = run_ingestion()

    print("Running preprocessing...")
    run_preprocessing()

    print("Running detection...")
    past_area, recent_area, flood_area, percent_increase = run_detection()

    print("Running risk engine...")
    risk_level = run_risk_engine(past_area, recent_area, flood_area, percent_increase)

    print("Final Risk Level:", risk_level)

if __name__ == "__main__":
    main()