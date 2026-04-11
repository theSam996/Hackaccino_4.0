# 🛡️ Backend Setup Guide
## Cyber-Physical Anomaly Detection System (Nuclear Safety)
**Project:** Dabloons | **Stack:** Node.js · Express · SSE · Python ML (Isolation Forest)

---

## Architecture Overview

```
Flutter App
    │  (SSE — text/event-stream)
    ▼
Node.js / Express          ← handles HTTP, SSE, routing, demo triggers
    │  (child_process.spawn every 500ms)
    ▼
Python  ml/predict.py      ← Isolation Forest inference
    │
    ▼
models/isolation_forest.pkl + scaler.pkl
```

Node.js owns the API and streaming. Python owns the ML — cleanly separated.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18.x LTS+ | `node --version` |
| Python | 3.10+ | `python3 --version` |
| pip | latest | `pip install --upgrade pip` |
| Git | any | Version control |

---

## 1. Project Structure

```
backend/
├── src/
│   ├── server.js            # Express entry point
│   ├── dataEngine.js        # Synthetic sensor data generator
│   ├── sseStream.js         # SSE broadcaster (500ms interval)
│   └── routes/
│       ├── health.js        # GET /health, GET /model/status
│       ├── stream.js        # GET /stream
│       └── control.js       # POST /inject-payload, POST /reset
│
├── ml/                      # ← Python ML layer
│   ├── generate_dataset.py  # Creates training CSVs
│   ├── train_model.py       # Trains & validates Isolation Forest
│   └── predict.py           # Stateless inference (called by Node.js)
│
├── models/                  # Auto-created by train_model.py
│   ├── isolation_forest.pkl
│   ├── scaler.pkl
│   └── model_meta.json
│
├── data/                    # Auto-created by generate_dataset.py
│   ├── baseline_normal.csv  # 5000 rows — normal operations
│   └── attack_scenario.csv  # 1000 rows — Stuxnet-style attack
│
├── .env
├── .gitignore
└── package.json
```

---

## 2. Node.js Setup

```bash
mkdir backend && cd backend
npm init -y

npm install express dotenv cors
npm install --save-dev nodemon
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev":   "nodemon src/server.js"
  }
}
```

---

## 3. Python ML Setup

```bash
# Inside the backend/ folder
pip install numpy pandas scikit-learn joblib
```

---

## 4. .env

```env
# Server
PORT=8000
NODE_ENV=development

# SSE
STREAM_INTERVAL_MS=500

# ML — path to the Python predict script
PYTHON_BIN=python3
PREDICT_SCRIPT=./ml/predict.py
MODEL_META_PATH=./models/model_meta.json
```

---

## 5. .gitignore

```
node_modules/
.env
data/
models/
__pycache__/
*.pkl
```

---

## 6. ML Layer — Python Scripts

### Step 1: Generate the dummy dataset

```bash
python3 ml/generate_dataset.py
```

Creates two CSVs in `data/`:

| File | Rows | Description |
|------|------|-------------|
| `baseline_normal.csv` | 5000 | Both IT logs and physical sensors in sync |
| `attack_scenario.csv` | 1000 | IT logs spoofed at normal, physical sensors spike |

**Columns in both files:**

| Column | Unit | Description |
|--------|------|-------------|
| `timestamp` | ISO 8601 | Sample time |
| `it_rpm` | RPM | IT dashboard reading (pump speed) |
| `it_temp_c` | °C | IT dashboard reading (coolant temp) |
| `it_pressure_bar` | bar | IT dashboard reading (pressure) |
| `it_vibration_mms` | mm/s | IT dashboard reading (vibration) |
| `physical_rpm` | RPM | Actual hardware sensor |
| `physical_temp_c` | °C | Actual hardware sensor |
| `physical_pressure_bar` | bar | Actual hardware sensor |
| `physical_vibration_mms` | mm/s | Actual hardware sensor |
| `attack_mode` | 0/1 | Ground truth flag |
| `label` | normal/attack | Human-readable label |

**Normal vs Attack values:**

| Metric | Normal | Attack (physical) | IT stays at |
|--------|--------|-------------------|-------------|
| RPM | ~1200 | ~3800 | ~1200 (spoofed) |
| Temp | ~285°C | ~620°C | ~285°C (spoofed) |
| Pressure | ~72 bar | ~140 bar | ~72 bar (spoofed) |
| Vibration | ~0.12 mm/s | ~2.85 mm/s | ~0.12 mm/s (spoofed) |

### Step 2: Train the model

```bash
python3 ml/train_model.py
```

- Trains **Isolation Forest** on divergence features (physical minus IT values)
- Validates against attack data — achieves **100% attack recall**
- Saves `models/isolation_forest.pkl`, `scaler.pkl`, `model_meta.json`

Expected output:
```
[✓] Training samples: 5000
[✓] Model trained
[✓] Model saved  → models/isolation_forest.pkl
[✓] Scaler saved → models/scaler.pkl
[✓] Metadata saved → models/model_meta.json

── Validation ─────────────────────────────────
              precision    recall  f1-score
      attack       1.00      1.00      1.00
      normal       1.00      0.99      1.00
```

### How `predict.py` works (called by Node.js)

Node.js spawns Python per stream tick, passes a JSON data point via stdin, reads the result from stdout:

```js
// In sseStream.js
const { spawn } = require('child_process');
const py = spawn('python3', ['ml/predict.py']);
py.stdin.write(JSON.stringify(dataPoint) + '\n');
py.stdin.end();
py.stdout.on('data', (buf) => {
  const prediction = JSON.parse(buf.toString());
  // prediction = { anomaly_score, is_anomaly, confidence, raw_score, divergences }
});
```

**Prediction output shape:**
```json
{
  "anomaly_score": 0.92,
  "is_anomaly": true,
  "confidence": 1.0,
  "raw_score": -0.169,
  "divergences": {
    "div_rpm": 2600,
    "div_temp": 335,
    "div_pressure": 68,
    "div_vibration": 2.68
  }
}
```

---

## 7. API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server + model status |
| GET | `/stream` | SSE telemetry stream — Flutter connects here |
| POST | `/inject-payload` | Triggers attack scenario |
| POST | `/reset` | Returns to normal baseline |
| GET | `/model/status` | Returns `model_meta.json` contents |

**SSE event payload:**
```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "it_rpm": 1200, "physical_rpm": 3812,
  "it_temp_c": 285, "physical_temp_c": 618,
  "it_pressure_bar": 72, "physical_pressure_bar": 143,
  "it_vibration_mms": 0.12, "physical_vibration_mms": 2.81,
  "anomaly_score": 0.92,
  "is_anomaly": true,
  "confidence": 1.0,
  "alert": true
}
```

---

## 8. Full Startup Sequence

```bash
# 1. Generate dummy dataset
python3 ml/generate_dataset.py

# 2. Train Isolation Forest
python3 ml/train_model.py

# 3. Start Node.js dev server
npm run dev
```

---

## 9. Test the Endpoints

```bash
# Health
curl http://localhost:8000/health

# Live SSE stream
curl -N http://localhost:8000/stream

# Inject attack
curl -X POST http://localhost:8000/inject-payload

# Reset to normal
curl -X POST http://localhost:8000/reset

# Model metadata
curl http://localhost:8000/model/status
```

---

## 10. Demo Checklist (Pre-Pitch)

- [ ] `data/baseline_normal.csv` and `data/attack_scenario.csv` exist
- [ ] `models/isolation_forest.pkl` and `models/scaler.pkl` exist
- [ ] `npm run dev` running — server live on `:8000`
- [ ] `GET /stream` shows green live data
- [ ] `POST /inject-payload` → physical sensors spike, IT stays normal
- [ ] `is_anomaly: true` fires within 1–2 ticks (~1 second)
- [ ] `POST /reset` → back to green
- [ ] Share `http://<your-ip>:8000` with frontend team

---

## 11. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find module` | `npm install` |
| Port in use | `npx kill-port 8000` |
| `Model not found` | Run `python3 ml/train_model.py` |
| `python3: command not found` | Set `PYTHON_BIN=python` in `.env` |
| No anomaly firing | Check `predict.py` — lower `ANOMALY_THRESHOLD` from `-0.05` to `-0.02` |
| SSE drops connection | Ensure `Connection: keep-alive` header is set |

---

*Dabloons · Hackathon MVP · Node.js API + Python ML · Frontend-agnostic SSE*