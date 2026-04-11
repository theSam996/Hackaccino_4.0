/**
 * routes/health.js
 * ----------------
 * GET /health       — quick server liveness check
 * GET /model/status — returns model metadata from models/model_meta.json
 */

"use strict";

const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");

require("dotenv").config();

const MODEL_META_PATH = process.env.MODEL_META_PATH
  || path.join(__dirname, "../models/model_meta.json");

const START_TIME = Date.now();

// GET /health
router.get("/health", (req, res) => {
  const modelExists = fs.existsSync(MODEL_META_PATH);
  res.json({
    status:         "ok",
    model_loaded:   modelExists,
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp:      new Date().toISOString(),
  });
});

// GET /model/status
router.get("/model/status", (req, res) => {
  if (!fs.existsSync(MODEL_META_PATH)) {
    return res.status(404).json({
      loaded:  false,
      error:   "Model metadata not found. Run: python3 ml/train_model.py",
      path:    MODEL_META_PATH,
    });
  }
  try {
    const meta = JSON.parse(fs.readFileSync(MODEL_META_PATH, "utf8"));
    res.json({ loaded: true, ...meta });
  } catch (err) {
    res.status(500).json({ loaded: false, error: err.message });
  }
});

module.exports = router;