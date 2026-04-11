/**
 * sseStream.js
 * ------------
 * Manages all SSE client connections and the central broadcast loop.
 *
 * The broadcast interval is started ONLY when the first client connects
 * and stopped when the last client disconnects — no wasted CPU/ML calls
 * when nobody is watching.
 *
 * Every STREAM_INTERVAL_MS it:
 *   1. Calls generateSample() from dataEngine.js
 *   2. Calls runPredict() from predictRunner.js (singleton Python process)
 *   3. Merges sensor data + ML prediction into one event payload
 *   4. Broadcasts it to every connected SSE client
 */

"use strict";

const { generateSample } = require("./dataEngine");
const { runPredict }     = require("./predictRunner");

require("dotenv").config();

const STREAM_INTERVAL_MS = parseInt(process.env.STREAM_INTERVAL_MS || "500", 10);

// ── Active SSE client registry ────────────────────────────────────────────────
const clients = new Set();

// ── Interval handle — null when no clients are connected ─────────────────────
let intervalId = null;

// ── Loop control ─────────────────────────────────────────────────────────────

function startLoop() {
  if (intervalId) return; // already running
  intervalId = setInterval(tick, STREAM_INTERVAL_MS);
  console.log(`[SSE] Broadcast loop started — interval: ${STREAM_INTERVAL_MS}ms`);
}

function stopLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[SSE] Broadcast loop paused — no clients connected");
  }
}

// ── Client management ────────────────────────────────────────────────────────

/**
 * Register a new SSE response object.
 * Called from routes/stream.js when a client connects.
 */
function addClient(res) {
  clients.add(res);
  console.log(`[SSE] Client connected  — total: ${clients.size}`);
  startLoop(); // start only when someone is listening
}

/**
 * Remove a disconnected SSE response object.
 * Called from routes/stream.js on req 'close' event.
 */
function removeClient(res) {
  clients.delete(res);
  console.log(`[SSE] Client disconnected — total: ${clients.size}`);
  if (clients.size === 0) stopLoop(); // pause when nobody is watching
}

// ── Broadcast ────────────────────────────────────────────────────────────────

/**
 * Send a serialised JSON payload to all connected clients.
 * @param {object} data
 */
function broadcast(data) {
  if (clients.size === 0) return;
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(message);
    } catch (err) {
      // Client likely disconnected mid-write; remove it
      console.warn("[SSE] Write failed, removing stale client:", err.message);
      clients.delete(res);
    }
  }
  // If a stale-client purge just emptied the set, stop the loop
  if (clients.size === 0) stopLoop();
}

// ── Tick ─────────────────────────────────────────────────────────────────────

/**
 * One broadcast cycle — called by setInterval.
 * Uses the persistent Python singleton (predictRunner) instead of spawning
 * a new child process on every tick.
 */
async function tick() {
  try {
    const sample     = generateSample();
    const prediction = await runPredict(sample);

    const payload = {
      ...sample,
      anomaly_score: prediction.anomaly_score,
      is_anomaly:    prediction.is_anomaly,
      confidence:    prediction.confidence,
      raw_score:     prediction.raw_score,
      divergences:   prediction.divergences,
      alert:         prediction.is_anomaly === true,
      ...(prediction.error        ? { ml_error:        prediction.error        } : {}),
      ...(prediction.fallback     ? { fallback:         prediction.fallback     } : {}),
      ...(prediction.fallback_reason ? { fallback_reason: prediction.fallback_reason } : {}),
    };

    broadcast(payload);
  } catch (err) {
    console.error("[SSE] Broadcast tick error:", err.message);
  }
}

module.exports = { addClient, removeClient, broadcast };