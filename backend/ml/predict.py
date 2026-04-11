"""
predict.py
----------
Stateless inference script — called by Node.js via child_process.spawn.
Reads ONE data point from stdin as JSON, returns prediction as JSON to stdout.

Node.js usage:
    const { spawn } = require('child_process');
    const py = spawn('python3', ['ml/predict.py']);
    py.stdin.write(JSON.stringify(dataPoint) + '\\n');
    py.stdin.end();
    py.stdout.on('data', (data) => console.log(JSON.parse(data)));

Input JSON shape:
    {
      "it_rpm": 1200, "it_temp_c": 285, "it_pressure_bar": 72, "it_vibration_mms": 0.12,
      "physical_rpm": 3800, "physical_temp_c": 620, "physical_pressure_bar": 140, "physical_vibration_mms": 2.8
    }

Output JSON shape:
    {
      "anomaly_score": 0.87,     // 0.0–1.0, higher = more anomalous
      "is_anomaly": true,
      "confidence": 0.91,
      "raw_score": -0.14,        // raw Isolation Forest decision_function value
      "divergences": { "div_rpm": 2600, "div_temp": 335, ... }
    }
"""

import sys
import json
import joblib
import numpy as np
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent
MODEL_PATH  = BASE_DIR / "models" / "isolation_forest.pkl"
SCALER_PATH = BASE_DIR / "models" / "scaler.pkl"

# ── Load model once (this script is short-lived per call) ─────────────────────
try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
except FileNotFoundError as e:
    print(json.dumps({"error": f"Model not found: {e}. Run: python ml/train_model.py"}))
    sys.exit(1)

FEATURES = ["div_rpm", "div_temp", "div_pressure", "div_vibration"]

# Threshold: Isolation Forest decision_function — below this = anomaly
# (negative scores = outlier territory)
ANOMALY_THRESHOLD = -0.05


def normalize_score(raw: float) -> float:
    """
    Map raw decision_function score to 0.0–1.0.
    Scores above +0.2  → 0.0 (clearly normal)
    Scores below -0.2  → 1.0 (clearly anomalous)
    """
    clipped = max(-0.2, min(0.2, raw))
    return round(1.0 - (clipped + 0.2) / 0.4, 4)


def predict(data: dict) -> dict:
    # Compute divergences (physical minus IT)
    divs = {
        "div_rpm":       data["physical_rpm"]           - data["it_rpm"],
        "div_temp":      data["physical_temp_c"]        - data["it_temp_c"],
        "div_pressure":  data["physical_pressure_bar"]  - data["it_pressure_bar"],
        "div_vibration": data["physical_vibration_mms"] - data["it_vibration_mms"],
    }

    X = np.array([[divs[f] for f in FEATURES]])
    X_scaled = scaler.transform(X)

    raw_score    = float(model.decision_function(X_scaled)[0])
    is_anomaly   = raw_score < ANOMALY_THRESHOLD
    anomaly_score = normalize_score(raw_score)
    confidence   = round(min(1.0, anomaly_score * 1.1), 4)  # slight boost for UI display

    return {
        "anomaly_score":  anomaly_score,
        "is_anomaly":     bool(is_anomaly),
        "confidence":     confidence,
        "raw_score":      round(raw_score, 6),
        "divergences":    {k: round(v, 4) for k, v in divs.items()},
    }


# ── Read from stdin, write to stdout ──────────────────────────────────────────
if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read().strip()
        data = json.loads(raw_input)
        result = predict(data)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
        sys.exit(1)
    except KeyError as e:
        print(json.dumps({"error": f"Missing field in input: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)