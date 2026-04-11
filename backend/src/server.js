/**
 * server.js
 * ---------
 * Express entry point for the Cyber-Physical Anomaly Detection backend.
 *
 * Startup sequence:
 *   1. Load env vars
 *   2. Mount middleware (CORS, JSON)
 *   3. Mount routes
 *   4. Start SSE broadcast loop (Python ML called each tick)
 *   5. Listen on PORT
 */

"use strict";

const express  = require("express");
const cors     = require("cors");
const path     = require("path");
require("dotenv").config();

const app = express();
const PORT = parseInt(process.env.PORT || "8000", 10);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));   // tighten before production
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/",       require("../routes/health"));   // GET /health, GET /model/status
app.use("/",       require("../routes/stream"));   // GET /stream
app.use("/",       require("../routes/control"));  // POST /inject-payload, POST /reset, GET /attack/status

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Start SSE broadcast loop ───────────────────────────────────────────────
const { startBroadcastLoop } = require("./sseStream");
startBroadcastLoop();

// ── Listen ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[✓] Server running on http://localhost:${PORT}`);
  console.log(`[✓] Endpoints:`);
  console.log(`      GET  /health`);
  console.log(`      GET  /model/status`);
  console.log(`      GET  /stream          ← Flutter SSE connection`);
  console.log(`      POST /inject-payload  ← Demo: start attack`);
  console.log(`      POST /reset           ← Demo: back to normal`);
  console.log(`      GET  /attack/status\n`);
});

module.exports = app;