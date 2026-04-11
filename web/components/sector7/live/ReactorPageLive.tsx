"use client";

import { ReactorTopologySchematic } from "@/components/sector7/ReactorTopologySchematic";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function ReactorThermalLive() {
  const { frame } = useTelemetryStream();
  if (!frame) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-full font-mono text-[10px] text-on-surface-variant">
          Connecting to shared telemetry…
        </div>
      </div>
    );
  }

  const cells: [string, string][] = [
    ["Core outlet", `${frame.physical_temp_c.toFixed(1)} °C`],
    ["Pressurizer", `${(frame.physical_pressure_bar * 0.1 + 14.8).toFixed(2)} MPa`],
    ["Steam gen ΔT", `${Math.abs(frame.divergences.div_temp).toFixed(1)} °C`],
    ["Flow A (rpm proxy)", `${frame.physical_rpm.toFixed(0)}`],
    ["Flow B", `${frame.it_rpm.toFixed(0)} IT`],
    ["Containment Δ", `${(frame.anomaly_score * 0.25).toFixed(2)} kPa`],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cells.map(([k, v]) => (
        <div
          key={k}
          className="border border-outline-variant/15 bg-surface-container-high p-3"
        >
          <div className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant">
            {k}
          </div>
          <div className="font-mono text-sm text-white">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function ReactorTopologyLive() {
  const { frame } = useTelemetryStream();
  const showAttack =
    frame?.mode === "attack" || Boolean(frame?.is_anomaly);

  return (
    <>
      <p className="mb-3 font-mono text-[10px] text-on-surface-variant">
        Shared live state with Command — breach when payload or model flags anomaly.
      </p>
      <ReactorTopologySchematic attackActive={showAttack} />
    </>
  );
}

export function ReactorRodLive() {
  const { frame } = useTelemetryStream();
  const bars = frame?.bars.thermal?.length
    ? frame.bars.thermal
    : [35, 38, 40, 42, 41, 39, 37, 36, 38, 40];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-primary-fixed/40 transition-[height] duration-500"
            style={{ height: `${Math.max(8, Math.min(100, h))}%` }}
          />
        ))}
      </div>
      <div className="font-mono text-[10px] text-on-surface-variant sm:w-48">
        Demand trace: nominal
        <br />
        Actual thermal bar:{" "}
        <span className="text-secondary">
          {frame ? "live from SSE" : "…"}
        </span>
      </div>
    </div>
  );
}
