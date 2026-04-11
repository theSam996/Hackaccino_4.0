"use client";

import { Panel } from "@/components/sector7/SectionPage";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function TelemetryPageLive() {
  const { frame, connected } = useTelemetryStream();
  const motion = frame?.bars.motion?.length
    ? frame.bars.motion
    : Array(10).fill(12);
  const consumed = frame
    ? (9.2 + frame.anomaly_score * 0.8).toFixed(2)
    : "—";
  const headroom = frame
    ? Math.max(0.5, 4.2 - frame.anomaly_score * 12).toFixed(1)
    : "—";

  const streams = [
    {
      id: "OT-BUS-A",
      rate: frame ? `${(4.0 + frame.anomaly_score * 1.2).toFixed(1)}k pkt/s` : "—",
      health: frame?.is_anomaly ? "DEGRADED" : "NOMINAL",
      lag: frame ? `${(1.8 + frame.anomaly_score * 6).toFixed(1)} ms` : "—",
    },
    {
      id: "HMI-BRIDGE",
      rate: frame ? `${(800 + frame.physical_vibration_mms * 40).toFixed(0)} pkt/s` : "—",
      health: connected ? "NOMINAL" : "OFFLINE",
      lag: frame ? `${(5 + frame.anomaly_score * 25).toFixed(0)} ms` : "—",
    },
    {
      id: "HISTORIAN-S7",
      rate: frame ? `${(100 + frame.anomaly_score * 80).toFixed(0)} evt/s` : "—",
      health:
        frame?.model_fallback || frame?.is_anomaly ? "DEGRADED" : "NOMINAL",
      lag: frame ? `${(30 + frame.anomaly_score * 120).toFixed(0)} ms` : "—",
    },
    {
      id: "EXT-MESH",
      rate: "2.1k pkt/s",
      health: frame?.mode === "attack" ? "DEGRADED" : "NOMINAL",
      lag: frame ? `${(8 + frame.anomaly_score * 40).toFixed(0)} ms` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Panel title="Sample rate budget (live)">
        <div className="space-y-3 font-mono text-[10px] text-on-surface-variant">
          <div className="flex justify-between border-b border-outline-variant/10 pb-2">
            <span>Allocated</span>
            <span className="text-secondary">10.0 kHz</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant/10 pb-2">
            <span>Consumed</span>
            <span className="text-white">{consumed} kHz</span>
          </div>
          <div className="flex justify-between">
            <span>Headroom</span>
            <span
              className={
                Number(headroom) < 2 ? "text-primary-fixed" : "text-secondary"
              }
            >
              {headroom}%
            </span>
          </div>
        </div>
      </Panel>
      <Panel title="Buffer depth (physical vib envelope)">
        <div className="flex h-28 items-end gap-1 sm:h-32">
          {motion.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-secondary/40 transition-[height] duration-300"
              style={{ height: `${Math.max(8, Math.min(100, h))}%` }}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[9px] text-on-surface-variant">
          Rolling window from live SSE · same signal as Command motion bars
        </p>
      </Panel>
      <Panel title="Clock sync" className="md:col-span-2 xl:col-span-1">
        <p className="font-mono text-[10px] leading-relaxed text-on-surface-variant">
          Last frame (UTC-ish from plant):{" "}
          <span className="text-white">
            {frame?.timestamp ?? "—"}
          </span>
          <br />
          Model confidence:{" "}
          <span className="text-secondary">
            {frame ? `${(frame.confidence * 100).toFixed(0)}%` : "—"}
          </span>
          <br />
          Fallback:{" "}
          <span className="text-white">
            {frame?.model_fallback ? "yes" : "no"}
          </span>
        </p>
      </Panel>
      <Panel
        title="Stream matrix"
        className="md:col-span-2 xl:col-span-3"
        action={
          <span className="material-symbols-outlined text-xs text-secondary">
            table_chart
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-mono text-[10px]">
            <thead className="border-b border-outline-variant/15 uppercase text-on-surface-variant">
              <tr>
                <th className="py-2 pr-4">Stream</th>
                <th className="py-2 pr-4">Rate</th>
                <th className="py-2 pr-4">Health</th>
                <th className="py-2">Lag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {streams.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 text-white">{row.id}</td>
                  <td className="py-2 pr-4">{row.rate}</td>
                  <td
                    className={`py-2 pr-4 ${row.health === "DEGRADED" ? "text-primary-fixed" : "text-secondary"}`}
                  >
                    {row.health}
                  </td>
                  <td className="py-2">{row.lag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
