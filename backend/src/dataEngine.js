/**
 * Synthetic IT vs physical telemetry — normal / attack modes.
 * Shapes match ml/predict.py input JSON.
 */

function noise(amp = 1) {
  return (Math.random() - 0.5) * 2 * amp;
}

const BASE_IT = {
  it_rpm: 1200,
  it_temp_c: 285,
  it_pressure_bar: 72,
  it_vibration_mms: 0.12,
};

/** Max expected divergences (attack) — used for % display in UI matrix */
const DIVERGENCE_SCALES = {
  div_rpm: 2800,
  div_temp: 360,
  div_pressure: 75,
  div_vibration: 2.85,
};

let mode = "normal";
let attackTick = 0;
let globalTick = 0;

const HISTORY_LEN = 72;

/** @type {{ timestamps: string[], it_rpm: number[], physical_rpm: number[], it_temp_c: number[], physical_temp_c: number[], it_pressure_bar: number[], physical_pressure_bar: number[], it_vibration_mms: number[], physical_vibration_mms: number[] }} */
const history = {
  timestamps: [],
  it_rpm: [],
  physical_rpm: [],
  it_temp_c: [],
  physical_temp_c: [],
  it_pressure_bar: [],
  physical_pressure_bar: [],
  it_vibration_mms: [],
  physical_vibration_mms: [],
};

/** Rolling synthetic “mesh” nodes — drift with anomaly */
const netState = { w1: 0.02, w2: 0.4, w3: 0.08, w4: 0.15 };

/** @type {string[]} */
const scadaLog = [];

function pushScada(line, tone = "default") {
  const t = new Date().toISOString().slice(11, 19);
  scadaLog.unshift({ t, line, tone });
  while (scadaLog.length > 24) scadaLog.pop();
}

function easeInQuad(t) {
  return t * t;
}

function appendHistory(sample) {
  const ts = sample.timestamp;
  history.timestamps.push(ts);
  history.it_rpm.push(sample.it_rpm);
  history.physical_rpm.push(sample.physical_rpm);
  history.it_temp_c.push(sample.it_temp_c);
  history.physical_temp_c.push(sample.physical_temp_c);
  history.it_pressure_bar.push(sample.it_pressure_bar);
  history.physical_pressure_bar.push(sample.physical_pressure_bar);
  history.it_vibration_mms.push(sample.it_vibration_mms);
  history.physical_vibration_mms.push(sample.physical_vibration_mms);
  const trim = () => {
    if (history.timestamps.length <= HISTORY_LEN) return;
    history.timestamps.shift();
    history.it_rpm.shift();
    history.physical_rpm.shift();
    history.it_temp_c.shift();
    history.physical_temp_c.shift();
    history.it_pressure_bar.shift();
    history.physical_pressure_bar.shift();
    history.it_vibration_mms.shift();
    history.physical_vibration_mms.shift();
  };
  trim();
}

function nextSample() {
  globalTick++;
  if (mode === "attack") attackTick++;

  const it = {
    it_rpm: BASE_IT.it_rpm + noise(10),
    it_temp_c: BASE_IT.it_temp_c + noise(1.2),
    it_pressure_bar: BASE_IT.it_pressure_bar + noise(0.8),
    it_vibration_mms: Math.max(0.02, BASE_IT.it_vibration_mms + noise(0.025)),
  };

  let physical_rpm = it.it_rpm + noise(18);
  let physical_temp_c = it.it_temp_c + noise(1.5);
  let physical_pressure_bar = it.it_pressure_bar + noise(1.1);
  let physical_vibration_mms = Math.max(
    0.02,
    it.it_vibration_mms + noise(0.04),
  );

  if (mode === "attack") {
    const p = easeInQuad(Math.min(attackTick / 55, 1));
    physical_rpm = it.it_rpm + 2600 * p + noise(45);
    physical_temp_c = it.it_temp_c + 335 * p + noise(8);
    physical_pressure_bar = it.it_pressure_bar + 68 * p + noise(3);
    physical_vibration_mms = it.it_vibration_mms + 2.65 * p + noise(0.12);
  }

  const sample = {
    timestamp: new Date().toISOString(),
    ...it,
    physical_rpm,
    physical_temp_c,
    physical_pressure_bar,
    physical_vibration_mms,
    mode,
  };

  appendHistory(sample);
  return sample;
}

function divergencesFromSample(s) {
  return {
    div_rpm: s.physical_rpm - s.it_rpm,
    div_temp: s.physical_temp_c - s.it_temp_c,
    div_pressure: s.physical_pressure_bar - s.it_pressure_bar,
    div_vibration: s.physical_vibration_mms - s.it_vibration_mms,
  };
}

function pctFromDiv(divs) {
  const pct = (key) => {
    const k = /** @type {keyof typeof DIVERGENCE_SCALES} */ (key);
    const scale = DIVERGENCE_SCALES[k] || 1;
    return Math.min(100, (Math.abs(divs[k]) / scale) * 100);
  };
  return {
    div_rpm: pct("div_rpm"),
    div_temp: pct("div_temp"),
    div_pressure: pct("div_pressure"),
    div_vibration: pct("div_vibration"),
  };
}

function tickNetNodes(anomalyScore) {
  const bump = anomalyScore * 0.35;
  netState.w1 = Math.max(0, Math.min(100, netState.w1 + noise(0.15) + bump * 0.02));
  netState.w2 = Math.max(0, Math.min(100, netState.w2 + noise(0.2)));
  netState.w3 = Math.max(0, Math.min(100, netState.w3 + noise(0.12)));
  netState.w4 = Math.max(0, Math.min(100, netState.w4 + noise(0.25) + bump * 0.6));
}

function getMode() {
  return mode;
}

function injectPayload() {
  if (mode === "attack") return;
  mode = "attack";
  attackTick = 0;
  pushScada("PAYLOAD INJECT — HMI spoofing armed; physical bus live", "error");
}

function reset() {
  mode = "normal";
  attackTick = 0;
  pushScada("FACILITY RESET — baseline telemetry restored", "secondary");
}

let lastAnomaly = false;

function onPrediction(isAnomaly, score) {
  if (isAnomaly && !lastAnomaly) {
    pushScada(
      `ISOLATION FOREST — anomaly_score ${score.toFixed(2)} (threshold crossed)`,
      "error",
    );
  }
  lastAnomaly = isAnomaly;
}

function buildChartPayload() {
  const n = history.timestamps.length;
  const chart = [];
  for (let i = 0; i < n; i++) {
    chart.push({
      i,
      t: history.timestamps[i].slice(11, 19),
      it_rpm: history.it_rpm[i],
      physical_rpm: history.physical_rpm[i],
      it_temp: history.it_temp_c[i],
      physical_temp: history.physical_temp_c[i],
      it_pressure: history.it_pressure_bar[i],
      physical_pressure: history.physical_pressure_bar[i],
      it_vibration: history.it_vibration_mms[i],
      physical_vibration: history.physical_vibration_mms[i],
    });
  }
  return chart;
}

function getScadaLog() {
  return scadaLog;
}

function getNetPercents() {
  return { w1: netState.w1, w2: netState.w2, w3: netState.w3, w4: netState.w4 };
}

module.exports = {
  nextSample,
  divergencesFromSample,
  pctFromDiv,
  DIVERGENCE_SCALES,
  tickNetNodes,
  getMode,
  injectPayload,
  reset,
  onPrediction,
  buildChartPayload,
  getScadaLog,
  pushScada,
  getNetPercents,
};

// Boot message
pushScada("SCADA bridge online — SSE channel open", "secondary");
