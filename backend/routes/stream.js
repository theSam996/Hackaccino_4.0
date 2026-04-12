/**
 * routes/stream.js
 * ----------------
 * GET /stream
 *
 * Flutter (or any client) connects here to receive the live telemetry feed.
 * Uses Server-Sent Events (SSE) — uni-directional, lightweight, no socket.io needed.
 *
 * SSE event shape (sent every STREAM_INTERVAL_MS):
 * {
 *   timestamp, it_rpm, it_temp_c, it_pressure_bar, it_vibration_mms,
 *   physical_rpm, physical_temp_c, physical_pressure_bar, physical_vibration_mms,
 *   attack_intensity, anomaly_score, is_anomaly, confidence, raw_score,
 *   divergences, divergence_pct, matrix, chart, scada, bars, alert
 * }
 */

"use strict";

const express                                = require("express");
const router                                 = express.Router();
const { addClient, removeClient, startLoop } = require("../src/sseLoop");

router.get("/stream", (req, res) => {
  // ── Set SSE headers ────────────────────────────────────────────────────────
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy
  res.flushHeaders();

  // ── Send an immediate keep-alive comment so client knows it's connected ────
  res.write(": connected\n\n");

  // ── Register this response object with the broadcaster ────────────────────
  addClient(res);
  startLoop(); // start broadcast loop (no-op if already running)

  // ── Clean up when client disconnects ──────────────────────────────────────
  req.on("close",  () => removeClient(res));
  req.on("end",    () => removeClient(res));
  req.on("error",  () => removeClient(res));
});

module.exports = router;