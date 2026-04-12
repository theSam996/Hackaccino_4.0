const {
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
} = require("./dataEngine");
const { runPredict } = require("./predictRunner");

// ── Auto-shutdown threshold ──────────────────────────────────────────────────
const SHUTDOWN_THRESHOLD = 0.99; // 99% anomaly score triggers emergency shutdown
let plantShutdown = false;       // true after auto-shutdown, cleared on manual reset

/** @type {Set<import('http').ServerResponse>} */
const clients = new Set();

let intervalId = null;
let tickBusy = false;

function broadcast(obj) {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  for (const res of clients) {
    try {
      res.write(line);
    } catch {
      clients.delete(res);
    }
  }
}

function normalizeWindow(values) {
  if (!values.length) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v) =>
    Math.max(8, Math.min(100, Math.round(((v - lo) / span) * 100))),
  );
}

function barsFromChart(chart) {
  const take = chart.slice(-10);
  const motion = normalizeWindow(take.map((p) => p.physical_vibration));
  const thermal = normalizeWindow(take.map((p) => p.physical_temp));
  const vibDelta = normalizeWindow(
    take.map((p) => Math.abs(p.physical_vibration - p.it_vibration)),
  );
  return { motion, thermal, vibration: vibDelta };
}

async function tick() {
  if (tickBusy) return;
  tickBusy = true;
  try {
  // ── If plant is already shutdown, broadcast flatlined data ─────────────
  if (plantShutdown) {
    const flatPayload = {
      timestamp: new Date().toISOString(),
      mode: "shutdown",
      it_rpm: 0, physical_rpm: 0,
      it_temp_c: 0, physical_temp_c: 0,
      it_pressure_bar: 0, physical_pressure_bar: 0,
      it_vibration_mms: 0, physical_vibration_mms: 0,
      anomaly_score: 0,
      is_anomaly: false,
      confidence: 0,
      raw_score: 0,
      divergences: { div_rpm: 0, div_temp: 0, div_pressure: 0, div_vibration: 0 },
      divergence_pct: { div_rpm: 0, div_temp: 0, div_pressure: 0, div_vibration: 0 },
      matrix: [
        { label: "RPM_Δ", value: "0.0%", ok: true, raw: 0 },
        { label: "TMP_Δ", value: "0.0%", ok: true, raw: 0 },
        { label: "PRS_Δ", value: "0.0%", ok: true, raw: 0 },
        { label: "VIB_Δ", value: "0.0%", ok: true, raw: 0 },
        { label: "NET_W1", value: "0.0%", ok: true, raw: 0 },
        { label: "NET_W2", value: "0.0%", ok: true, raw: 0 },
        { label: "NET_W3", value: "0.0%", ok: true, raw: 0 },
        { label: "NET_W4", value: "0.0%", ok: true, raw: 0 },
      ],
      chart: [],
      scada: getScadaLog(),
      bars: { motion: Array(10).fill(0), thermal: Array(10).fill(0), vibration: Array(10).fill(0) },
      alert: false,
      model_fallback: false,
      plant_shutdown: true,
    };
    broadcast(flatPayload);
    return;
  }

  const sample = nextSample();
  const point = {
    it_rpm: sample.it_rpm,
    it_temp_c: sample.it_temp_c,
    it_pressure_bar: sample.it_pressure_bar,
    it_vibration_mms: sample.it_vibration_mms,
    physical_rpm: sample.physical_rpm,
    physical_temp_c: sample.physical_temp_c,
    physical_pressure_bar: sample.physical_pressure_bar,
    physical_vibration_mms: sample.physical_vibration_mms,
  };

  let prediction;
  try {
    prediction = await runPredict(point);
  } catch {
    prediction = {
      anomaly_score: 0,
      is_anomaly: false,
      confidence: 0,
      raw_score: 0,
      divergences: divergencesFromSample(sample),
    };
  }

  onPrediction(prediction.is_anomaly, prediction.anomaly_score);
  tickNetNodes(prediction.anomaly_score);

  const divs = prediction.divergences || divergencesFromSample(sample);
  const divPct = pctFromDiv(divs);
  const net = getNetPercents();

  const matrix = [
    { label: "RPM_Δ", pct: divPct.div_rpm },
    { label: "TMP_Δ", pct: divPct.div_temp },
    { label: "PRS_Δ", pct: divPct.div_pressure },
    { label: "VIB_Δ", pct: divPct.div_vibration },
    { label: "NET_W1", pct: net.w1 },
    { label: "NET_W2", pct: net.w2 },
    { label: "NET_W3", pct: net.w3 },
    { label: "NET_W4", pct: net.w4 },
  ].map((cell) => ({
    label: cell.label,
    value: `${cell.pct.toFixed(1)}%`,
    ok: cell.pct < 12,
    raw: cell.pct,
  }));

  const chart = buildChartPayload();
  const bars = barsFromChart(chart);

  // ── Auto-shutdown: if anomaly >= 99% during an active attack, kill the plant
  if (
    prediction.anomaly_score >= SHUTDOWN_THRESHOLD &&
    isAttackMode() &&
    !plantShutdown
  ) {
    plantShutdown = true;
    setAttackMode(false);
    console.log(
      `[AUTO-SHUTDOWN] Anomaly score ${(prediction.anomaly_score * 100).toFixed(1)}% >= ${SHUTDOWN_THRESHOLD * 100}% — plant SCRAMMED`,
    );
  }

  const payload = {
    timestamp: sample.timestamp,
    mode: sample.mode,
    ...point,
    anomaly_score: prediction.anomaly_score,
    is_anomaly: prediction.is_anomaly,
    confidence: prediction.confidence,
    raw_score: prediction.raw_score,
    divergences: {
      div_rpm: divs.div_rpm,
      div_temp: divs.div_temp,
      div_pressure: divs.div_pressure,
      div_vibration: divs.div_vibration,
    },
    divergence_pct: divPct,
    matrix,
    chart,
    scada: getScadaLog(),
    bars,
    alert: prediction.is_anomaly,
    model_fallback: Boolean(prediction.fallback),
    plant_shutdown: plantShutdown,
  };

  broadcast(payload);
  } finally {
    tickBusy = false;
  }
}

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function startLoop() {
  if (intervalId) return;
  const ms = Number(process.env.STREAM_INTERVAL_MS) || 500;
  intervalId = setInterval(() => {
    tick().catch(() => {});
  }, ms);
}

function clearShutdown() {
  plantShutdown = false;
}

module.exports = {
  addClient,
  removeClient,
  startLoop,
  broadcast,
  clearShutdown,
};
