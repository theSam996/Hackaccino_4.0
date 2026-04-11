const { spawn, spawnSync } = require("child_process");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
let pyBin = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

// Automatically use the virtual environment python if it exists
const venvPath = path.join(ROOT, "..", ".venv", "Scripts", "python.exe");
if (!process.env.PYTHON_BIN && fs.existsSync(venvPath)) {
  pyBin = venvPath;
}

const script = process.env.PREDICT_SCRIPT || path.join(ROOT, "ml", "predict.py");

let py = null;
let pending = null;
let isShuttingDown = false;

function startPython() {
  if (py) return;

  py = spawn(pyBin, [script], {
    cwd: ROOT,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  const rl = readline.createInterface({ input: py.stdout });
  rl.on("line", (line) => {
    if (pending) {
      const { resolve, point } = pending;
      pending = null;
      try {
        const parsed = JSON.parse(line);
        if (parsed.error) {
          resolve(heuristicFallback(point, parsed.error));
        } else {
          resolve(parsed);
        }
      } catch (err) {
        resolve(heuristicFallback(point, "invalid json: " + err.message));
      }
    }
  });

  py.stderr.on("data", (d) => console.error(`[ML Error] ${d.toString().trim()}`));

  py.on("close", (code) => {
    if (isShuttingDown) return;
    console.error(`[ML] predict.py exited with code ${code}, restarting in 1s...`);
    if (pending) {
      pending.resolve(heuristicFallback(pending.point, `exit ${code}`));
      pending = null;
    }
    py = null;
    setTimeout(startPython, 1000);
  });
}

function runPredict(point) {
  return new Promise((resolve) => {
    if (!py) return resolve(heuristicFallback(point, "process unavailable"));
    if (pending) return resolve(heuristicFallback(point, "prediction already in progress"));

    pending = { resolve, point };
    try {
      py.stdin.write(JSON.stringify(point) + "\n");
    } catch (err) {
      pending = null;
      resolve(heuristicFallback(point, "write error"));
    }
  });
}

function divergencesOf(point) {
  return {
    div_rpm: point.physical_rpm - point.it_rpm,
    div_temp: point.physical_temp_c - point.it_temp_c,
    div_pressure: point.physical_pressure_bar - point.it_pressure_bar,
    div_vibration: point.physical_vibration_mms - point.it_vibration_mms,
  };
}

function heuristicFallback(point, reason) {
  const divs = divergencesOf(point);
  const scaled =
    Math.abs(divs.div_rpm) / 2800 +
    Math.abs(divs.div_temp) / 360 +
    Math.abs(divs.div_pressure) / 75 +
    Math.abs(divs.div_vibration) / 2.8;
  const anomaly_score = Math.min(0.99, scaled / 3.2);
  const is_anomaly = anomaly_score > 0.52;
  return {
    anomaly_score: Math.round(anomaly_score * 10000) / 10000,
    is_anomaly,
    confidence: Math.min(0.99, 0.5 + anomaly_score * 0.45),
    raw_score: -scaled * 0.08,
    divergences: {
      div_rpm: Math.round(divs.div_rpm * 100) / 100,
      div_temp: Math.round(divs.div_temp * 100) / 100,
      div_pressure: Math.round(divs.div_pressure * 100) / 100,
      div_vibration: Math.round(divs.div_vibration * 1000) / 1000,
    },
    fallback: true,
    fallback_reason: reason,
  };
}

// ---------------------------------------------------------
// CLEANUP: Kill Python child on any exit so no zombies remain
// ---------------------------------------------------------
function cleanupChildren() {
  isShuttingDown = true;
  if (py) {
    console.log(`[ML] Cleaning up Python child process before exit... (PID: ${py.pid})`);
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", py.pid, "/f", "/t"]);
      } else {
        process.kill(-py.pid, "SIGKILL"); // Kill entire process group
      }
      py.kill("SIGKILL");
    } catch (e) {}
    py = null;
  }
}

// Register signal handlers exactly once
process.once("exit",   cleanupChildren);
process.once("SIGINT",  () => { cleanupChildren(); process.exit(0); });
process.once("SIGTERM", () => { cleanupChildren(); process.exit(0); });
process.once("SIGUSR2", () => { cleanupChildren(); process.kill(process.pid, "SIGUSR2"); }); // nodemon restart

// Start the singleton Python process when this module is first imported
startPython();

module.exports = { runPredict, divergencesOf };