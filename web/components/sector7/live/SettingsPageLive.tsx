"use client";

import { Panel } from "@/components/sector7/SectionPage";
import { LiveWallClock } from "@/components/sector7/LiveWallClock";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function SettingsPageLive() {
  const { frame, connected, error } = useTelemetryStream();

  return (
    <Panel title="Live telemetry session (shared)">
      <div className="space-y-3 font-mono text-[10px] text-on-surface-variant">
        <div className="flex flex-wrap justify-between gap-2">
          <span>Wall clock</span>
          <LiveWallClock className="text-secondary" />
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span>SSE</span>
          <span className={connected ? "text-secondary" : "text-error"}>
            {connected ? "connected" : "disconnected"}
          </span>
        </div>
        {error ? (
          <div className="text-error">{error}</div>
        ) : null}
        <div className="flex flex-wrap justify-between gap-2">
          <span>Last frame</span>
          <span className="text-white">{frame?.timestamp ?? "—"}</span>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span>Plant mode</span>
          <span
            className={
              frame?.mode === "attack" ? "text-error" : "text-secondary"
            }
          >
            {frame?.mode?.toUpperCase() ?? "—"}
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span>Anomaly score</span>
          <span className={frame?.is_anomaly ? "text-error" : "text-white"}>
            {frame ? `${(frame.anomaly_score * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>
    </Panel>
  );
}
