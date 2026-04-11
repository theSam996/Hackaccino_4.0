const {
  nextSample,
  divergencesFromSample,
  pctFromDiv,
  tickNetNodes,
  onPrediction,
  buildChartPayload,
  getScadaLog,
  getNetPercents,
} = require("./dataEngine");
const { runPredict } = require("./predictRunner");

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

module.exports = {
  addClient,
  removeClient,
  startLoop,
  broadcast,
};
