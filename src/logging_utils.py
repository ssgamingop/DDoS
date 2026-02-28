import json
import math
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

LOG_DIR = Path("output")
LOG_PATH = LOG_DIR / "logs.txt"
_LOG_LOCK = Lock()


def _to_json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    if isinstance(value, dict):
        return {str(k): _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_to_json_safe(v) for v in value]
    return str(value)


def log_event(stage: str, status: str, **details: Any) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stage": stage,
        "status": status,
    }
    if details:
        record["details"] = _to_json_safe(details)

    with _LOG_LOCK:
        if LOG_PATH.exists() and LOG_PATH.stat().st_size > 0:
            with LOG_PATH.open("rb") as existing:
                existing.seek(-1, 2)
                if existing.read(1) != b"\n":
                    with LOG_PATH.open("a", encoding="utf-8") as log_file:
                        log_file.write("\n")
        with LOG_PATH.open("a", encoding="utf-8") as log_file:
            log_file.write(json.dumps(record, ensure_ascii=True) + "\n")
