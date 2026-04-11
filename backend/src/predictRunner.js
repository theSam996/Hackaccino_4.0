const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");

/**
 * @param {Record<string, number>} point — IT + physical fields
 * @returns {Promise<{ anomaly_score: number, is_anomaly: boolean, confidence: number, raw_score: number, divergences: Record<string, number>, error?: string }>}
 */
function runPredict(point) {
  const pyBin = process.env.PYTHON_BIN || "python3";
  const script =
    process.env.PREDICT_SCRIPT || path.join(ROOT, "ml", "predict.py");

  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    const py = spawn(pyBin, [script], {
      cwd: ROOT,
      env: process.env,
    });
    let out = "";
    let err = "";
    py.stdout.on("data", (d) => {
      out += d.toString();
    });
    py.stderr.on("data", (d) => {
      err += d.toString();
    });
    py.on("error", () => {
      done(heuristicFallback(point, "spawn failed"));
    });
    py.on("close", (code) => {
      if (code !== 0 || !out.trim()) {
        done(heuristicFallback(point, err || `exit ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(out.trim());
        if (parsed.error) {
          done(heuristicFallback(point, parsed.error));
          return;
        }
        done(parsed);
      } catch {
        done(heuristicFallback(point, "invalid json"));
      }
    });
    py.stdin.write(JSON.stringify(point) + "\n");
    py.stdin.end();
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

module.exports = { runPredict, divergencesOf };
