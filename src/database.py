import sqlite3
import os
from datetime import datetime
from .logging_utils import log_event

DB_PATH = "data/risk_history.db"

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create the state table as required by PS6
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            risk_level TEXT NOT NULL,
            water_expansion_km2 REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    log_event("database", "initialized", db_path=DB_PATH)

def save_analysis(lat: float, lng: float, risk_level: str, expansion: float):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute('''
        INSERT INTO risk_history (timestamp, lat, lng, risk_level, water_expansion_km2)
        VALUES (?, ?, ?, ?, ?)
    ''', (timestamp, lat, lng, risk_level, expansion))
    
    conn.commit()
    conn.close()
    log_event(
        "database",
        "analysis_saved",
        db_path=DB_PATH,
        timestamp=timestamp,
        lat=lat,
        lng=lng,
        risk_level=risk_level,
        water_expansion_km2=expansion,
    )

def get_recent_history(limit=10):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # To return dicts instead of tuples
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT timestamp, lat, lng, risk_level, water_expansion_km2 
        FROM risk_history 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
