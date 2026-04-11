"use client";

import { LiveWallClock } from "@/components/sector7/LiveWallClock";
import {
  SITE_ZONES,
  useOperatorPreferences,
} from "@/contexts/OperatorPreferencesContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function LiveGlobalStrip() {
  const { frame, connected, error } = useTelemetryStream();
  const { prefs } = useOperatorPreferences();
  const showAttack =
    frame?.mode === "attack" || Boolean(frame?.is_anomaly);
  const zoneLabel =
    SITE_ZONES.find((z) => z.id === prefs.zone)?.label ?? prefs.zone;

  const stripPad =
    prefs.telemetryDensity === "compact"
      ? "py-1.5"
      : prefs.telemetryDensity === "diagnostic"
        ? "py-3.5"
        : "py-2.5";
  const textSize =
    prefs.telemetryDensity === "compact"
      ? "text-[9px] sm:text-[10px]"
      : prefs.telemetryDensity === "diagnostic"
        ? "text-xs sm:text-sm"
        : "text-[10px] sm:text-[11px]";

  return (
    <div
      className={`s7-live-strip -mx-4 mb-4 border-b border-outline-variant/25 bg-surface-container/80 px-4 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6 ${stripPad}`}
    >
      <div
        className={`flex flex-col gap-2 font-mono text-on-surface-variant sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-1 ${textSize}`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-label text-[9px] uppercase tracking-widest text-white">
            Live site
          </span>
          <span className="text-on-surface-variant">
            Zone <span className="text-secondary">{zoneLabel}</span>
          </span>
          <span className="text-secondary">
            Wall{" "}
            <LiveWallClock className="text-white" subsecond />
          </span>
          <span
            className={`inline-flex items-center gap-1.5 ${
              connected ? "text-secondary" : "text-error"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-secondary" : "bg-error"}`}
            />
            {connected ? "SSE stream" : "Offline"}
          </span>
          {error ? <span className="max-w-md truncate text-error">{error}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {frame ? (
            <>
              <span>
                Telemetry{" "}
                <span className="text-white">
                  {frame.timestamp.slice(11, 23)}
                </span>
              </span>
              <span>
                Mode{" "}
                <span
                  className={
                    frame.mode === "attack" ? "text-error" : "text-secondary"
                  }
                >
                  {frame.mode.toUpperCase()}
                </span>
              </span>
              <span>
                Anomaly{" "}
                <span className={showAttack ? "text-error" : "text-white"}>
                  {(frame.anomaly_score * 100).toFixed(1)}%
                </span>
              </span>
              <span className="hidden sm:inline">
                IT rpm{" "}
                <span className="text-white">{frame.it_rpm.toFixed(0)}</span> ·
                phys{" "}
                <span className="text-white">
                  {frame.physical_rpm.toFixed(0)}
                </span>
              </span>
              <span className="hidden md:inline">
                Temp{" "}
                <span className="text-white">
                  {frame.physical_temp_c.toFixed(1)}
                </span>
                °C · Vib{" "}
                <span className="text-white">
                  {frame.physical_vibration_mms.toFixed(2)}
                </span>{" "}
                mm/s
              </span>
            </>
          ) : (
            <span>Awaiting first telemetry frame…</span>
          )}
        </div>
      </div>
    </div>
  );
}
