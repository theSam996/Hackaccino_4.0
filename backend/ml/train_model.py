"""
train_model.py
--------------
Trains an Isolation Forest on baseline_normal.csv and saves the model.
Also validates against attack_scenario.csv to confirm detection works.

Run:
    python ml/train_model.py
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    USE_TORCH = True
except ImportError:
    USE_TORCH = False
    from sklearn.ensemble import IsolationForest

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, mean_squared_error

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent
DATA_DIR   = BASE_DIR / "data"
MODEL_DIR  = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH   = MODEL_DIR / "isolation_forest.pkl"
SCALER_PATH  = MODEL_DIR / "scaler.pkl"
META_PATH    = MODEL_DIR / "model_meta.json"

# ── Features used for anomaly detection ───────────────────────────────────────
# We train ONLY on divergence between IT and physical readings.
# This makes the model purely sensitive to spoofing — not absolute sensor values.
DIVERGENCE_FEATURES = [
    "div_rpm",       # physical_rpm - it_rpm
    "div_temp",      # physical_temp_c - it_temp_c
    "div_pressure",  # physical_pressure_bar - it_pressure_bar
    "div_vibration", # physical_vibration_mms - it_vibration_mms
]

RAW_FEATURES = [
    "it_rpm", "it_temp_c", "it_pressure_bar", "it_vibration_mms",
    "physical_rpm", "physical_temp_c", "physical_pressure_bar", "physical_vibration_mms",
]

# Sensor pairs used for per-feature RMSE (IT prediction vs physical reality)
SENSOR_PAIRS = [
    ("it_rpm",           "physical_rpm",           "RPM"),
    ("it_temp_c",        "physical_temp_c",        "Temp (°C)"),
    ("it_pressure_bar",  "physical_pressure_bar",  "Pressure (bar)"),
    ("it_vibration_mms", "physical_vibration_mms", "Vibration (mm/s)"),
]


def compute_divergences(df: pd.DataFrame) -> pd.DataFrame:
    """Compute physical-vs-IT divergence columns."""
    df = df.copy()
    df["div_rpm"]       = df["physical_rpm"]           - df["it_rpm"]
    df["div_temp"]      = df["physical_temp_c"]        - df["it_temp_c"]
    df["div_pressure"]  = df["physical_pressure_bar"]  - df["it_pressure_bar"]
    df["div_vibration"] = df["physical_vibration_mms"] - df["it_vibration_mms"]
    return df


def compute_rmse(df: pd.DataFrame, label: str) -> dict:
    """
    Compute per-sensor RMSE treating the IT reading as the 'predicted' value
    and the physical sensor reading as ground truth.

    In normal ops, RMSE should be very low (IT ≈ physical).
    During an attack, RMSE spikes because IT is spoofed while physical diverges.
    """
    print(f"\n── RMSE: IT prediction vs Physical reality ({label}) ────────────")
    rmse_results = {}
    for it_col, phys_col, name in SENSOR_PAIRS:
        mse  = mean_squared_error(df[phys_col], df[it_col])
        rmse = np.sqrt(mse)
        rmse_results[name] = round(rmse, 4)
        print(f"  {name:<20} RMSE = {rmse:>10.4f}")

    # Overall RMSE across all divergence features (normalized, dimensionless)
    all_it   = df[[p[0] for p in SENSOR_PAIRS]].values
    all_phys = df[[p[1] for p in SENSOR_PAIRS]].values

    # Normalize each column before combining so units don't dominate
    means = all_phys.mean(axis=0)
    stds  = all_phys.std(axis=0) + 1e-8
    all_it_norm   = (all_it   - means) / stds
    all_phys_norm = (all_phys - means) / stds

    overall_rmse = np.sqrt(mean_squared_error(all_phys_norm, all_it_norm))
    rmse_results["overall_normalized"] = round(overall_rmse, 4)
    print(f"  {'Overall (normalized)':<20} RMSE = {overall_rmse:>10.4f}")

    return rmse_results


# ── Load & prepare training data ──────────────────────────────────────────────
print("Loading baseline_normal.csv ...")
normal_df = pd.read_csv(DATA_DIR / "baseline_normal.csv")
normal_df = compute_divergences(normal_df)

X_train = normal_df[DIVERGENCE_FEATURES].values
print(f"[✓] Training samples: {len(X_train)}")

# ── RMSE on normal baseline (expected: very low — IT ≈ physical) ──────────────
rmse_normal = compute_rmse(normal_df, "Normal Baseline")

# ── Scale features ────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# ── Train Model ────────────────────────────────────────────────────
if USE_TORCH:
    print("\nTraining Autoencoder on GPU (if available) ...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    class Autoencoder(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.encoder = nn.Sequential(
                nn.Linear(input_dim, 8),
                nn.ReLU(),
                nn.Linear(8, 4),
                nn.ReLU()
            )
            self.decoder = nn.Sequential(
                nn.Linear(4, 8),
                nn.ReLU(),
                nn.Linear(8, input_dim)
            )
        def forward(self, x):
            return self.decoder(self.encoder(x))

    model = Autoencoder(X_train_scaled.shape[1]).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    X_tensor = torch.tensor(X_train_scaled, dtype=torch.float32)
    dataset = TensorDataset(X_tensor, X_tensor)
    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    epochs = 20
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)
        
        train_loss /= len(loader.dataset)
        print(f"  Epoch [{epoch+1}/{epochs}] Loss: {train_loss:.6f} (GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    print("[✓] Autoencoder model trained")
    
    # Convert model back to CPU for saving
    model.to('cpu')
    # Save a torch model wrapper to joblib or save state dict
    torch.save(model.state_dict(), MODEL_DIR / "autoencoder.pth")
    # For predicting backwards compatibility locally
    class TorchModelWrapper:
        def __init__(self, pt_model):
            self.pt_model = pt_model
        def decision_function(self, X):
            self.pt_model.eval()
            with torch.no_grad():
                Xt = torch.tensor(X, dtype=torch.float32)
                recon = self.pt_model(Xt)
                mse = torch.mean((Xt - recon) ** 2, dim=1).numpy()
                return -mse # Negative MSE so large error = low score
                
        def predict(self, X):
            scores = self.decision_function(X)
            # -1 for anomaly (MSE > threshold), 1 for normal
            return np.where(scores < -0.05, -1, 1)

    wrapped_model = TorchModelWrapper(model)
    model = wrapped_model
    joblib.dump('torch_model', MODEL_PATH)
else:
    print("\nTraining Isolation Forest ...")
    model = IsolationForest(
        n_estimators=200,      # more trees = more stable scores
        contamination=0.02,    # ~2% of training data treated as outliers
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled)
    print("[✓] Model trained")
    joblib.dump(model, MODEL_PATH)

# ── Save model + scaler ───────────────────────────────────────────────────────
joblib.dump(scaler, SCALER_PATH)
print(f"[✓] Model saved  → {MODEL_PATH}")
print(f"[✓] Scaler saved → {SCALER_PATH}")

# ── Validation against attack_scenario.csv ────────────────────────────────────
attack_df = pd.read_csv(DATA_DIR / "attack_scenario.csv")
attack_df = compute_divergences(attack_df)

# RMSE on attack data (expected: much higher — IT spoofed, physical spikes)
attack_only_df = attack_df[attack_df["label"] == "attack"]
rmse_attack = compute_rmse(attack_only_df, "Attack Scenario")

# RMSE ratio: how much worse does the model look during an attack?
print("\n── RMSE Ratio (Attack / Normal) — higher = more detectable ──")
for sensor in rmse_normal:
    ratio = rmse_attack[sensor] / (rmse_normal[sensor] + 1e-8)
    print(f"  {sensor:<20}  x{ratio:>7.1f}")

# Combine for classification evaluation
eval_df = pd.concat([
    normal_df.assign(true_label="normal").tail(500),  # last 500 normal samples
    attack_only_df.assign(true_label="attack"),
], ignore_index=True)

X_eval        = eval_df[DIVERGENCE_FEATURES].values
X_eval_scaled = scaler.transform(X_eval)

# Isolation Forest: +1 = inlier (normal), -1 = outlier (anomaly)
preds  = model.predict(X_eval_scaled)
scores = model.decision_function(X_eval_scaled)  # lower = more anomalous

pred_labels = ["normal" if p == 1 else "attack" for p in preds]
true_labels = eval_df["true_label"].tolist()

print("\n── Classification Report ─────────────────────────────────────")
print(classification_report(true_labels, pred_labels, target_names=["attack", "normal"]))

print("── Confusion Matrix (rows=actual, cols=predicted) ────────────")
cm = confusion_matrix(true_labels, pred_labels, labels=["normal", "attack"])
print(f"             normal  attack")
print(f"  normal       {cm[0][0]:4d}    {cm[0][1]:4d}")
print(f"  attack       {cm[1][0]:4d}    {cm[1][1]:4d}")

# Anomaly score samples
print("\n── Sample Anomaly Scores (lower = more anomalous) ───────────")
sample_normal = X_eval_scaled[:5]
sample_attack = X_eval_scaled[500:505]
print(f"  Normal samples : {model.decision_function(sample_normal).round(4)}")
print(f"  Attack samples : {model.decision_function(sample_attack).round(4)}")

# ── RMSE on model's anomaly scores vs true binary labels ──────────────────────
# Treats 0=normal / 1=attack as ground truth and the model's normalized
# continuous anomaly score (0–1) as the prediction.
# A low score here means the model's confidence closely tracks reality.
print("\n── RMSE: Anomaly Score vs True Label ────────────────────────")
true_binary = np.array([1 if t == "attack" else 0 for t in true_labels], dtype=float)
raw_scores  = model.decision_function(X_eval_scaled)

# Normalize decision_function output to 0–1 (higher = more anomalous)
score_min, score_max = raw_scores.min(), raw_scores.max()
norm_scores = 1.0 - (raw_scores - score_min) / (score_max - score_min + 1e-8)

score_rmse = np.sqrt(mean_squared_error(true_binary, norm_scores))
print(f"  Score RMSE = {score_rmse:.4f}  (0.0 = perfect, 1.0 = worst)")
print(f"  Interpretation: model's continuous score deviates ~{score_rmse:.1%} from the true 0/1 label")

# ── Save metadata ─────────────────────────────────────────────────────────────
meta = {
    "trained_at":         pd.Timestamp.now().isoformat(),
    "n_training_samples": int(len(X_train)),
    "features":           DIVERGENCE_FEATURES,
    "n_estimators":       200,
    "contamination":      0.02,
    "model_file":         str(MODEL_PATH),
    "scaler_file":        str(SCALER_PATH),
    "rmse": {
        "normal_baseline": rmse_normal,
        "attack_scenario": rmse_attack,
        "anomaly_score":   round(float(score_rmse), 4),
    },
}
with open(META_PATH, "w") as f:
    json.dump(meta, f, indent=2)
print(f"\n[✓] Metadata saved → {META_PATH}")
print("[✓] Validation complete. Model is ready.")