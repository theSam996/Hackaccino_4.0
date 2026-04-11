"use client";

import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function HeaderTelemetryStatus() {
  const { frame, connected } = useTelemetryStream();
  const alert = frame?.is_anomaly || frame?.mode === "attack";

  return (
    <div
      className={`hidden items-center gap-2 px-2 py-1.5 sm:flex sm:gap-3 sm:px-3 ${
        alert
          ? "bg-error-container/30 text-error"
          : "bg-stone-800 text-on-surface-variant"
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          connected
            ? alert
              ? "animate-pulse bg-error shadow-[0_0_8px_#ffb4ab]"
              : "bg-secondary shadow-[0_0_8px_#5ed4ff]"
            : "bg-stone-600"
        }`}
      />
      <span className="hidden font-mono text-[10px] uppercase tracking-widest md:inline">
        {connected
          ? alert
            ? "Anomaly / attack"
            : "Telemetry live"
          : "No stream"}
      </span>
      {frame && connected ? (
        <span className="font-mono text-[10px] text-white lg:text-[11px]">
          {(frame.anomaly_score * 100).toFixed(0)}% ·{" "}
          {frame.mode === "attack" ? "ATK" : "NORM"}
        </span>
      ) : null}
    </div>
  );
}
