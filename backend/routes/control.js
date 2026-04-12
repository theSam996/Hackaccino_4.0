/**
 * routes/control.js
 * -----------------
 * Demo trigger endpoints — used by the presenter during the pitch.
 *
 * POST /inject-payload  →  Starts the attack scenario
 * POST /reset           →  Returns to normal baseline
 */

"use strict";

const express                                       = require("express");
const router                                        = express.Router();
const { setAttackMode, isAttackMode, getAttackIntensity } = require("../src/dataEngine");
const { clearShutdown }                             = require("../src/sseLoop");

// POST /inject-payload
router.post("/inject-payload", (req, res) => {
  setAttackMode(true);
  console.log("[DEMO] Attack payload injected");
  res.json({
    status:      "attack_injected",
    attack_mode: true,
    message:     "Physical sensors will begin diverging from IT logs.",
  });
});

// POST /reset
router.post("/reset", (req, res) => {
  setAttackMode(false);
  clearShutdown();
  console.log("[DEMO] System reset to normal baseline");
  res.json({
    status:      "reset_to_normal",
    attack_mode: false,
    message:     "System returning to normal baseline.",
  });
});

// GET /attack/status  — useful for frontend to poll current state
router.get("/attack/status", (req, res) => {
  res.json({
    attack_mode:      isAttackMode(),
    attack_intensity: getAttackIntensity(),
  });
});

module.exports = router;