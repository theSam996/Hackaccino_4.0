# Hackaccino 4.0 - Cyber-Physical Anomaly Detection System

A real-time cyber-physical attack detection system for nuclear infrastructure, designed to identify Stuxnet-style attacks by correlating IT network logs with physical sensor telemetry.

## Overview

This system monitors digital IT network logs and physical sensor data in real-time, using machine learning to detect discrepancies that indicate a compromised network. When malicious activity is detected, the system triggers immediate facility lockdowns through a mobile command center.

## Features

- **Synthetic Data Engine**: Generates synchronized baseline and attack scenario data
- **Real-Time Data Streaming**: High-performance SSE pipeline for low-latency telemetry
- **ML Anomaly Detection**: Isolation Forest model for multi-dimensional outlier detection
- **Mobile Command Dashboard**: High-contrast UI with live telemetry charts
- **Emergency Override Protocol**: Visual alerts and lockdown warnings on anomaly detection

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express |
| ML | Python (scikit-learn, PyTorch) |
| Frontend | Next.js 16 + React 19 |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |

## Project Structure

```
Hackaccino_4.0/
├── backend/               # Node.js API server
│   ├── src/              # Express server & SSE streaming
│   ├── routes/           # API endpoints
│   ├── ml/              # Python ML scripts
│   │   ├── train_model.py
│   │   ├── predict.py
│   │   └── generate_dataset.py
│   └── data/            # CSV datasets
└── web/                  # Next.js frontend
    ├── components/      # React components
    ├── contexts/        # React contexts
    ├── hooks/           # Custom hooks
    └── lib/             # Utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- NumPy, Pandas, scikit-learn, PyTorch

### Backend Setup

```bash
cd backend
npm install

# Set up Python environment (one-time)
python -m venv .venv
.venv\Scripts\activate  # Linux/Mac: source .venv/bin/activate
pip install numpy pandas scikit-learn torch joblib

# Generate training data
python ml/generate_dataset.py

# Train the model
python ml/train_model.py

# Start the server
npm run dev
```

The backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd web
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stream` | GET | SSE real-time telemetry stream |
| `/control/inject` | POST | Trigger attack scenario |
| `/control/reset` | POST | Reset to normal operations |
| `/health` | GET | Health check |

## Demo Flow

1. Start backend and frontend servers
2. Dashboard shows green "Normal" state with synchronized data
3. Press "Inject Payload" to simulate network breach
4. IT logs remain green (spoofed), physical sensors spike to red
5. ML model detects anomaly and triggers lockdown alert

## License

ISC