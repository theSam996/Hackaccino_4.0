/**
 * dataEngine.js
 * -------------
 * Generates synthetic sensor data for the demo.
 *
 * Normal mode  → IT logs and physical sensors are in sync (green)
 * Attack mode  → IT logs stay spoofed at normal values while
 *                physical sensors spike toward critical levels
 */

"use strict";

// ── Global attack state (toggled by POST /inject-payload and POST /reset) ────
let attackMode = false;

// ── Sensor baselines (normal operations) ─────────────────────────────────────
const NORMAL = {
  rpm:       1200.0,
  temp:      285.0,   // °C
  pressure:  72.0,    // bar
  vibration: 0.12,    // mm/s
};

// ── Attack peak targets (what physical hardware reaches during attack) ────────
const ATTACK = {
  rpm:       3800.0,
  temp:      620.0,
  pressure:  140.0,
  vibration: 2.85,
};

// ── Ramp state — tracks how far into the attack we are (0.0 to 1.0) ──────────
let attackIntensity = 0.0;
const RAMP_STEP = 0.04; // ~50 ticks to reach full attack intensity

/**
 * Box-Muller transform — Gaussian noise without any external libraries.
 */
function gaussianNoise() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Add Gaussian noise scaled to ±pct of the base value.
 */
function withNoise(base, pct = 0.04) {
  return base + gaussianNoise() * base * pct;
}

/**
 * Generate one timestamped sensor data point.
 * Called every STREAM_INTERVAL_MS by sseStream.js.
 */
function generateSample() {
  // Smoothly ramp attack intensity up on attack, recover faster on reset
  if (attackMode) {
    attackIntensity = Math.min(1.0, attackIntensity + RAMP_STEP);
  } else {
    attackIntensity = Math.max(0.0, attackIntensity - RAMP_STEP * 2);
  }

  const i = attackIntensity;

  // IT logs — always report spoofed normal values (the digital lie)
  const it_rpm       = withNoise(NORMAL.rpm,       0.02);
  const it_temp      = withNoise(NORMAL.temp,       0.015);
  const it_pressure  = withNoise(NORMAL.pressure,   0.02);
  const it_vibration = withNoise(NORMAL.vibration,  0.03);

  // Physical sensors — diverge toward attack peaks proportional to intensity
  const phys_rpm       = withNoise(NORMAL.rpm       + i * (ATTACK.rpm       - NORMAL.rpm),       0.05);
  const phys_temp      = withNoise(NORMAL.temp      + i * (ATTACK.temp      - NORMAL.temp),      0.04);
  const phys_pressure  = withNoise(NORMAL.pressure  + i * (ATTACK.pressure  - NORMAL.pressure),  0.05);
  const phys_vibration = withNoise(NORMAL.vibration + i * (ATTACK.vibration - NORMAL.vibration), 0.06);

  return {
    timestamp:                new Date().toISOString(),
    it_rpm:                   +it_rpm.toFixed(2),
    it_temp_c:                +it_temp.toFixed(2),
    it_pressure_bar:          +it_pressure.toFixed(2),
    it_vibration_mms:         +it_vibration.toFixed(4),
    physical_rpm:             +phys_rpm.toFixed(2),
    physical_temp_c:          +phys_temp.toFixed(2),
    physical_pressure_bar:    +phys_pressure.toFixed(2),
    physical_vibration_mms:   +phys_vibration.toFixed(4),
    attack_intensity:         +i.toFixed(3),
  };
}

// ── State accessors ───────────────────────────────────────────────────────────
function setAttackMode(val) {
  attackMode = Boolean(val);
  if (!val) attackIntensity = 0.0; // hard-reset intensity on manual /reset
}

function isAttackMode()      { return attackMode; }
function getAttackIntensity() { return attackIntensity; }

module.exports = { generateSample, setAttackMode, isAttackMode, getAttackIntensity };
