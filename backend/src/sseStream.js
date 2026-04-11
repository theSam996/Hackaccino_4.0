/**
 * sseStream.js
 * ------------
 * Manages all SSE client connections and the central broadcast loop.
 *
 * Every STREAM_INTERVAL_MS it:
 *   1. Calls generateSample() from dataEngine.js
 *   2. Spawns python3 ml/predict.py, passes the sample as JSON via stdin
 *   3. Merges the sensor data + ML prediction into one event payload
 *   4. Broadcasts it to every connected SSE client
 *
 * Node.js owns the API layer. Python owns the ML layer.
 * They communicate through stdin/stdout — no HTTP overhead.
 */

"use strict";

const { spawn }         = require("child_process");
const path              = require("path");
const { generateSample } = require("./dataEngine");

require("dotenv").config();

const STREAM_INTERVAL_MS = parseInt(process.env.STREAM_INTERVAL_MS || "500", 10);
const PYTHON_BIN         = process.env.PYTHON_BIN        || (process.platform === "win32" ? "python" : "python3");
const PREDICT_SCRIPT     = process.env.PREDICT_SCRIPT    || path.join(__dirname, "../ml/predict.py");

// ── Active SSE client registry ────────────────────────────────────────────────
const clients = new Set();

/**
 * Register a new SSE response object.
 * Called from routes/stream.js when a client connects.
 */
function addClient(res) {
  clients.add(res);
  console.log(`[SSE] Client connected  — total: ${clients.size}`);
}

/**
 * Remove a disconnected SSE response object.
 * Called from routes/stream.js on req 'close' event.
 */
function removeClient(res) {
  clients.delete(res);
  console.log(`[SSE] Client disconnected — total: ${clients.size}`);
}

/**
 * Send a serialized JSON payload to all connected clients.
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
}

/**
 * Call ml/predict.py as a child process.
 * Passes dataPoint as JSON on stdin, resolves with parsed prediction from stdout.
 *
 * @param {object} dataPoint - Raw sensor reading from generateSample()
 * @returns {Promise<object>} - { anomaly_score, is_anomaly, confidence, raw_score, divergences }
 */
function callPythonPredict(dataPoint) {
  return new Promise((resolve) => {
    const py = spawn(PYTHON_BIN, [PREDICT_SCRIPT]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    py.on("close", (code) => {
      if (code !== 0 || stderr) {
        console.error(`[ML] predict.py exited ${code}:`, stderr.trim());
        // Return a safe fallback so the stream never dies
        resolve({ anomaly_score: 0, is_anomaly: false, confidence: 0, raw_score: 0, divergences: {}, error: stderr.trim() });
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        console.error("[ML] Failed to parse predict.py output:", stdout);
        resolve({ anomaly_score: 0, is_anomaly: false, confidence: 0, raw_score: 0, divergences: {}, error: "parse_error" });
      }
    });

    py.on("error", (err) => {
      console.error("[ML] Failed to spawn predict.py:", err.message);
      resolve({ anomaly_score: 0, is_anomaly: false, confidence: 0, raw_score: 0, divergences: {}, error: err.message });
    });

    // Send the data point to Python via stdin and close the pipe
    py.stdin.write(JSON.stringify(dataPoint) + "\n");
    py.stdin.end();
  });
}

/**
 * Main broadcast loop — runs on a fixed interval regardless of client count.
 * Safe: all errors are caught so the interval never silently dies.
 */
function startBroadcastLoop() {
  setInterval(async () => {
    try {
      const sample     = generateSample();
      const prediction = await callPythonPredict(sample);

      const payload = {
        ...sample,
        anomaly_score: prediction.anomaly_score,
        is_anomaly:    prediction.is_anomaly,
        confidence:    prediction.confidence,
        raw_score:     prediction.raw_score,
        divergences:   prediction.divergences,
        alert:         prediction.is_anomaly === true,
        ...(prediction.error ? { ml_error: prediction.error } : {}),
      };

      broadcast(payload);
    } catch (err) {
      console.error("[SSE] Broadcast loop error:", err.message);
    }
  }, STREAM_INTERVAL_MS);

  console.log(`[SSE] Broadcast loop started — interval: ${STREAM_INTERVAL_MS}ms`);
}

module.exports = { addClient, removeClient, broadcast, startBroadcastLoop };