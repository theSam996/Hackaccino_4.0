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
 * Called every STREAM_INTERVAL_MS by sseLoop.js.
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

// ── Chart history ring buffer ─────────────────────────────────────────────────
const CHART_MAX = 30;
const chartHistory = [];
let chartIndex = 0;

// ── SCADA log ring buffer ─────────────────────────────────────────────────────
const SCADA_MAX = 20;
const scadaLog = [];

// ── Neural-network simulated weights ──────────────────────────────────────────
const netNodes = { w1: 2.0, w2: 3.0, w3: 1.5, w4: 2.5 };

// ── Divergence thresholds for percentage scaling ─────────────────────────────
const DIV_RANGE = {
  div_rpm: 2800,
  div_temp: 360,
  div_pressure: 75,
  div_vibration: 2.8,
};

/**
 * nextSample — wraps generateSample, adds mode field,
 * and pushes data into the chart history ring buffer.
 */
function nextSample() {
  const sample = generateSample();
  sample.mode = attackMode ? "attack" : "normal";

  // Push into chart ring buffer
  const chartPoint = {
    i: chartIndex++,
    t: new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 8),
    it_rpm: sample.it_rpm,
    physical_rpm: sample.physical_rpm,
    it_temp: sample.it_temp_c,
    physical_temp: sample.physical_temp_c,
    it_pressure: sample.it_pressure_bar,
    physical_pressure: sample.physical_pressure_bar,
    it_vibration: sample.it_vibration_mms,
    physical_vibration: sample.physical_vibration_mms,
  };
  chartHistory.push(chartPoint);
  if (chartHistory.length > CHART_MAX) chartHistory.shift();

  return sample;
}

/**
 * Compute divergences from a raw sample.
 */
function divergencesFromSample(sample) {
  return {
    div_rpm:       sample.physical_rpm - sample.it_rpm,
    div_temp:      sample.physical_temp_c - sample.it_temp_c,
    div_pressure:  sample.physical_pressure_bar - sample.it_pressure_bar,
    div_vibration: sample.physical_vibration_mms - sample.it_vibration_mms,
  };
}

/**
 * Convert raw divergences to percentage (0-100) scale for the matrix UI.
 */
function pctFromDiv(divs) {
  return {
    div_rpm:       Math.min(100, (Math.abs(divs.div_rpm) / DIV_RANGE.div_rpm) * 100),
    div_temp:      Math.min(100, (Math.abs(divs.div_temp) / DIV_RANGE.div_temp) * 100),
    div_pressure:  Math.min(100, (Math.abs(divs.div_pressure) / DIV_RANGE.div_pressure) * 100),
    div_vibration: Math.min(100, (Math.abs(divs.div_vibration) / DIV_RANGE.div_vibration) * 100),
  };
}

/**
 * Simulate neural-network weight perturbation on each tick.
 */
function tickNetNodes(anomalyScore) {
  const perturb = () => gaussianNoise() * 1.2;
  const drift = anomalyScore * 15;
  netNodes.w1 = Math.max(0, Math.min(100, netNodes.w1 + perturb() + drift * 0.3));
  netNodes.w2 = Math.max(0, Math.min(100, netNodes.w2 + perturb() + drift * 0.2));
  netNodes.w3 = Math.max(0, Math.min(100, netNodes.w3 + perturb() + drift * 0.4));
  netNodes.w4 = Math.max(0, Math.min(100, netNodes.w4 + perturb() + drift * 0.1));
}

/**
 * Push a SCADA log entry based on prediction results.
 */
function onPrediction(isAnomaly, score) {
  const ts = new Date().toLocaleTimeString("en-GB", { hour12: false }).slice(0, 8);
  if (isAnomaly) {
    scadaLog.push({
      t: ts,
      line: "ANOMALY score=" + (score * 100).toFixed(1) + "%",
      tone: "error",
    });
  } else if (score > 0.3) {
    scadaLog.push({
      t: ts,
      line: "ELEVATED score=" + (score * 100).toFixed(1) + "%",
      tone: "warning",
    });
  } else {
    scadaLog.push({
      t: ts,
      line: "NOMINAL score=" + (score * 100).toFixed(1) + "%",
      tone: "default",
    });
  }
  if (scadaLog.length > SCADA_MAX) scadaLog.shift();
}

/**
 * Return the current chart history array.
 */
function buildChartPayload() {
  return chartHistory.slice();
}

/**
 * Return the current SCADA log.
 */
function getScadaLog() {
  return scadaLog.slice();
}

/**
 * Return current simulated neural-network percentages.
 */
function getNetPercents() {
  return {
    w1: +netNodes.w1.toFixed(2),
    w2: +netNodes.w2.toFixed(2),
    w3: +netNodes.w3.toFixed(2),
    w4: +netNodes.w4.toFixed(2),
  };
}

// ── State accessors ───────────────────────────────────────────────────────────
function setAttackMode(val) {
  attackMode = Boolean(val);
  if (!val) attackIntensity = 0.0; // hard-reset intensity on manual /reset
}

function isAttackMode()      { return attackMode; }
function getAttackIntensity() { return attackIntensity; }

module.exports = {
  generateSample,
  nextSample,
  divergencesFromSample,
  pctFromDiv,
  tickNetNodes,
  onPrediction,
  buildChartPayload,
  getScadaLog,
  getNetPercents,
  setAttackMode,
  isAttackMode,
  getAttackIntensity,
};