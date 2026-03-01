import math
from src.risk_engine import classify_risk

# (expansion_km2, pct, expected)
CASES = [
    (0.0, 0.0, "LOW"),
    (0.8, 30.0, "LOW"),
    (1.0, 30.0, "MODERATE"),
    (5.1, 10.0, "MODERATE"),
    (5.1, 60.0, "HIGH"),
    (25.0, 5.0, "HIGH"),
]

def test_classify_risk_thresholds():
    for exp, pct, expected in CASES:
        assert classify_risk(exp, pct) == expected


def test_monotonicity():
    # More expansion should not lower risk
    low = classify_risk(1.0, 24)
    high = classify_risk(1.0, 30)
    assert (low, high) in [("LOW", "MODERATE"), ("MODERATE", "MODERATE")]
