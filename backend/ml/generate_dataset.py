"""
generate_dataset.py
-------------------
Generates two CSV datasets for the Cyber-Physical Anomaly Detection System:
  1. baseline_normal.csv  — 5000 rows of synchronized normal operations
  2. attack_scenario.csv  — 1000 rows where IT logs are spoofed but
                            physical sensors diverge (Stuxnet-style attack)

Run:
    python ml/generate_dataset.py
"""

import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

# ── Seed for reproducibility ──────────────────────────────────────────────────
np.random.seed(42)

# ── Output paths ──────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── Helper: Gaussian noise ────────────────────────────────────────────────────
def add_noise(value, pct=0.05):
    """Add ±pct Gaussian noise to a scalar or array."""
    return value + np.random.normal(0, value * pct, size=np.shape(value))


# ── 1. NORMAL BASELINE (5000 samples) ─────────────────────────────────────────
def generate_normal(n=5000):
    """
    Both IT network logs and physical sensor readings are in sync.
    Small Gaussian noise on both streams to simulate real-world jitter.
    """
    start_time = datetime(2025, 1, 1, 0, 0, 0)
    timestamps = [start_time + timedelta(seconds=i * 0.5) for i in range(n)]

    # Base values (normal operations)
    base_rpm      = 1200.0
    base_temp     = 285.0    # °C — coolant temperature
    base_pressure = 72.0     # bar — system pressure
    base_vibration= 0.12     # mm/s — pump vibration

    rows = []
    for i in range(n):
        # Both IT and physical readings match (with tiny independent noise)
        it_rpm       = add_noise(base_rpm,       0.02)
        it_temp      = add_noise(base_temp,       0.015)
        it_pressure  = add_noise(base_pressure,   0.02)
        it_vibration = add_noise(base_vibration,  0.03)

        phys_rpm       = add_noise(base_rpm,       0.04)
        phys_temp      = add_noise(base_temp,       0.03)
        phys_pressure  = add_noise(base_pressure,   0.04)
        phys_vibration = add_noise(base_vibration,  0.05)

        rows.append({
            "timestamp":        timestamps[i].isoformat(),
            "it_rpm":           round(float(it_rpm),       2),
            "it_temp_c":        round(float(it_temp),      2),
            "it_pressure_bar":  round(float(it_pressure),  2),
            "it_vibration_mms": round(float(it_vibration), 4),
            "physical_rpm":           round(float(phys_rpm),       2),
            "physical_temp_c":        round(float(phys_temp),      2),
            "physical_pressure_bar":  round(float(phys_pressure),  2),
            "physical_vibration_mms": round(float(phys_vibration), 4),
            "attack_mode":      0,
            "label":            "normal",
        })

    return pd.DataFrame(rows)


# ── 2. ATTACK SCENARIO (1000 samples) ─────────────────────────────────────────
def generate_attack(n=1000):
    """
    Stuxnet-style attack:
      - IT logs remain SPOOFED at normal values (digital dashboard lies)
      - Physical sensors SPIKE into critical range
    First 100 rows = pre-attack normal, then divergence begins.
    """
    start_time = datetime(2025, 1, 2, 0, 0, 0)
    timestamps = [start_time + timedelta(seconds=i * 0.5) for i in range(n)]

    # Normal baselines (what IT keeps reporting — spoofed)
    spoof_rpm       = 1200.0
    spoof_temp      = 285.0
    spoof_pressure  = 72.0
    spoof_vibration = 0.12

    # Attack peak targets (what physical hardware actually reaches)
    peak_rpm       = 3800.0
    peak_temp      = 620.0
    peak_pressure  = 140.0
    peak_vibration = 2.85

    rows = []
    for i in range(n):
        # First 100 samples: pre-attack, everything normal
        if i < 100:
            attack_intensity = 0.0
        else:
            # Ramp up attack over ~50 samples, then sustain
            ramp = min(1.0, (i - 100) / 50.0)
            attack_intensity = ramp

        # IT logs: always show spoofed normal values
        it_rpm       = add_noise(spoof_rpm,       0.02)
        it_temp      = add_noise(spoof_temp,       0.015)
        it_pressure  = add_noise(spoof_pressure,   0.02)
        it_vibration = add_noise(spoof_vibration,  0.03)

        # Physical sensors: diverge toward attack peaks
        phys_rpm       = add_noise(spoof_rpm + attack_intensity * (peak_rpm - spoof_rpm),         0.05)
        phys_temp      = add_noise(spoof_temp + attack_intensity * (peak_temp - spoof_temp),       0.04)
        phys_pressure  = add_noise(spoof_pressure + attack_intensity * (peak_pressure - spoof_pressure), 0.05)
        phys_vibration = add_noise(spoof_vibration + attack_intensity * (peak_vibration - spoof_vibration), 0.06)

        rows.append({
            "timestamp":        timestamps[i].isoformat(),
            "it_rpm":           round(float(it_rpm),       2),
            "it_temp_c":        round(float(it_temp),      2),
            "it_pressure_bar":  round(float(it_pressure),  2),
            "it_vibration_mms": round(float(it_vibration), 4),
            "physical_rpm":           round(float(phys_rpm),       2),
            "physical_temp_c":        round(float(phys_temp),      2),
            "physical_pressure_bar":  round(float(phys_pressure),  2),
            "physical_vibration_mms": round(float(phys_vibration), 4),
            "attack_mode":      1 if attack_intensity > 0 else 0,
            "label":            "attack" if attack_intensity > 0 else "normal",
        })

    return pd.DataFrame(rows)


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating datasets...")

    normal_df = generate_normal(5000)
    normal_path = DATA_DIR / "baseline_normal.csv"
    normal_df.to_csv(normal_path, index=False)
    print(f"[✓] baseline_normal.csv  → {len(normal_df)} rows  →  {normal_path}")

    attack_df = generate_attack(1000)
    attack_path = DATA_DIR / "attack_scenario.csv"
    attack_df.to_csv(attack_path, index=False)
    print(f"[✓] attack_scenario.csv  → {len(attack_df)} rows  →  {attack_path}")

    # Quick sanity stats
    print("\n── Normal Baseline Stats ────────────────────────────────────")
    print(normal_df[["it_rpm","physical_rpm","it_temp_c","physical_temp_c"]].describe().round(2))

    print("\n── Attack Scenario Stats (attack rows only) ─────────────────")
    atk = attack_df[attack_df["label"] == "attack"]
    print(atk[["it_rpm","physical_rpm","it_temp_c","physical_temp_c"]].describe().round(2))

    print("\nDone.")