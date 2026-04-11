"use client";

import { Panel } from "@/components/sector7/SectionPage";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function SensorsPageLive() {
  const { frame } = useTelemetryStream();
  const alert = frame?.is_anomaly || frame?.mode === "attack";

  const feeds = [
    {
      id: "CCTV-04",
      zone: "Perimeter NE",
      fps: frame ? `${(28 + frame.anomaly_score * 8).toFixed(0)}` : "—",
      note: alert ? "motion mask" : "stable",
    },
    {
      id: "CCTV-11",
      zone: "Coolant hall",
      fps: frame ? `${(22 + frame.physical_vibration_mms * 2).toFixed(0)}` : "—",
      note: "AES-256-GCM",
    },
    {
      id: "BIO-02",
      zone: "Access vault",
      fps: "—",
      note: frame?.is_anomaly ? "re-verify" : "HSM-backed",
    },
    {
      id: "LSR-09",
      zone: "Grid array",
      fps: frame ? `${(90 + frame.anomaly_score * 40).toFixed(0)}` : "—",
      note: frame?.mode === "attack" ? "desync" : "locked",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {feeds.map((f) => (
          <Panel key={f.id} title={f.id}>
            <div className="aspect-video w-full bg-black/50">
              <div
                className={`flex h-full items-center justify-center font-mono text-[9px] ${
                  alert ? "text-error" : "text-on-surface-variant"
                }`}
              >
                {frame
                  ? `LIVE · ${f.note} · Δrpm ${frame.divergences.div_rpm.toFixed(0)}`
                  : "NO STREAM"}
              </div>
            </div>
            <dl className="mt-3 space-y-1 font-mono text-[9px] text-on-surface-variant">
              <div className="flex justify-between">
                <dt>Zone</dt>
                <dd className="text-white">{f.zone}</dd>
              </div>
              <div className="flex justify-between">
                <dt>FPS</dt>
                <dd className="text-secondary">{f.fps}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Phys temp</dt>
                <dd className="text-white">
                  {frame ? `${frame.physical_temp_c.toFixed(1)} °C` : "—"}
                </dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>

      <Panel
        title="Calibration queue"
        action={
          <span className="material-symbols-outlined text-xs text-secondary">
            tune
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-2 font-mono text-[10px] sm:grid-cols-2">
          <div className="border-l-2 border-secondary bg-surface-container-high p-3">
            THRM-1 — vib {frame?.physical_vibration_mms.toFixed(2) ?? "—"} mm/s
          </div>
          <div
            className={`border-l-2 ${alert ? "border-error" : "border-primary-fixed"} bg-surface-container-high p-3`}
          >
            LSR-09 — {alert ? "priority sweep" : "blocked (offline)"}
          </div>
        </div>
      </Panel>
    </>
  );
}
