require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const {
  injectPayload,
  reset,
  getMode,
  pushScada,
} = require("./dataEngine");
const { addClient, removeClient, startLoop } = require("./sseLoop");

const PORT = Number(process.env.PORT) || 8000;
const app = express();

const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin:
      allowed.length > 0
        ? allowed
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use(express.json());

const ROOT = path.join(__dirname, "..");
const META = path.join(ROOT, "models", "model_meta.json");

app.get("/health", (_req, res) => {
  const modelExists = fs.existsSync(path.join(ROOT, "models", "isolation_forest.pkl"));
  res.json({
    ok: true,
    mode: getMode(),
    model_loaded: modelExists,
    uptime_s: Math.round(process.uptime()),
  });
});

app.get("/model/status", (_req, res) => {
  try {
    if (!fs.existsSync(META)) {
      return res.status(404).json({ error: "model_meta.json not found" });
    }
    const meta = JSON.parse(fs.readFileSync(META, "utf8"));
    res.json(meta);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  addClient(res);
  startLoop();

  req.on("close", () => {
    removeClient(res);
  });
});

app.post("/inject-payload", (_req, res) => {
  injectPayload();
  pushScada("API: POST /inject-payload acknowledged", "warning");
  res.json({ ok: true, mode: getMode() });
});

app.post("/reset", (_req, res) => {
  reset();
  res.json({ ok: true, mode: getMode() });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[sector7-api] http://localhost:${PORT}  (SSE /stream)`);
  startLoop();
});
