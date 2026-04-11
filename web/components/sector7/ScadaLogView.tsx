"use client";

import { LiveWallClock } from "@/components/sector7/LiveWallClock";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function ScadaLogView() {
  const { frame, connected, error } = useTelemetryStream();

  return (
    <div className="flex min-h-[min(70vh,42rem)] flex-col overflow-hidden border border-outline-variant/15 bg-surface-container">
      <div className="flex flex-col gap-2 bg-surface-container-high px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
            SCADA log feed
          </span>
          <div className="flex items-center gap-2 border border-outline-variant/25 bg-black/25 px-2 py-1 font-mono text-[10px] text-secondary sm:text-xs">
            <span className="text-on-surface-variant">Local</span>
            <LiveWallClock subsecond className="text-white" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-on-surface-variant sm:text-xs">
            <span
              className={`inline-flex items-center gap-1.5 ${connected ? "text-secondary" : "text-error"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-secondary" : "bg-error"}`}
              />
              {connected ? "SSE" : "OFFLINE"}
            </span>
            {error ? <span className="text-error">{error}</span> : null}
          </div>
          <span className="material-symbols-outlined text-secondary">terminal</span>
        </div>
      </div>
      <p className="border-b border-outline-variant/15 bg-surface-container px-4 py-1.5 font-mono text-[9px] text-on-surface-variant sm:text-[10px]">
        Line prefix{" "}
        <span className="text-white">[ hh:mm:ss ]</span> is controller timestamp from the live
        stream; the header shows your current wall time (updates live).
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto p-4 font-mono text-xs sm:text-sm lg:text-base">
        {(frame?.scada ?? []).map((row, i) => (
          <div
            key={`${row.t}-${i}-${row.line.slice(0, 24)}`}
            className={
              row.tone === "secondary"
                ? "text-secondary"
                : row.tone === "error"
                  ? "text-error"
                  : row.tone === "warning"
                    ? "text-primary-fixed"
                    : "text-on-surface-variant"
            }
          >
            [ {row.t} ] {row.line}
          </div>
        ))}
        {!frame?.scada?.length ? (
          <div className="text-on-surface-variant">
            {connected
              ? "Waiting for log lines…"
              : "Connect the telemetry backend to stream SCADA events."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
