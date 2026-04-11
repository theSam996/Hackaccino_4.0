"use client";

import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLORS = [
  "bg-secondary/20",
  "bg-secondary/40",
  "bg-secondary/20",
  "bg-secondary/60",
  "bg-secondary/30",
  "bg-secondary/90",
  "bg-secondary/20",
  "bg-secondary/50",
  "bg-secondary/20",
  "bg-secondary",
];

const THERMAL_COLORS = [
  "bg-primary-fixed/20",
  "bg-primary-fixed/40",
  "bg-primary-fixed/20",
  "bg-primary-fixed/60",
  "bg-primary-fixed/30",
  "bg-primary-fixed/90",
  "bg-primary-fixed/20",
  "bg-primary-fixed/50",
  "bg-primary-fixed/20",
  "bg-primary-fixed",
];

function LiveBarStack({
  heights,
  palette,
}: {
  heights: number[];
  palette: string[];
}) {
  const vals = heights.length ? heights : Array(10).fill(15);
  return (
    <div className="flex h-14 items-end gap-1 overflow-x-auto pb-1 sm:h-16 lg:h-[4.5rem]">
      {vals.map((h, i) => (
        <div
          key={i}
          className={`w-1.5 shrink-0 transition-[height] duration-500 ease-out sm:w-2 ${palette[i % palette.length]}`}
          style={{ height: `${Math.max(6, Math.min(100, h))}%` }}
        />
      ))}
    </div>
  );
}

function MiniSyncChart({
  title,
  dataKeyIt,
  dataKeyPhys,
  unit,
  data,
}: {
  title: string;
  dataKeyIt: string;
  dataKeyPhys: string;
  unit: string;
  data: Record<string, string | number>[];
}) {
  return (
    <div className="border border-outline-variant/15 bg-black/20 p-2">
      <div className="font-label mb-2 text-[11px] uppercase tracking-widest text-on-surface-variant lg:text-xs">
        {title}{" "}
        <span className="font-mono text-secondary">({unit})</span>
      </div>
      <div className="h-[200px] w-full min-w-0 sm:h-[220px] lg:h-[248px]">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} syncId="s7">
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis
            width={44}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#1c1b1b",
              border: "1px solid #474747",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey={dataKeyIt}
            name="IT (spoofed)"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={400}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey={dataKeyPhys}
            name="Physical OT"
            stroke="#5ed4ff"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={400}
            animationEasing="ease-out"
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type TimelineEv = {
  time: string;
  title: string;
  detail: string;
  color: "secondary" | "primary-fixed" | "error";
};

function TimelineDot({
  color,
}: {
  color: "secondary" | "primary-fixed" | "error";
}) {
  const map = {
    secondary: "bg-secondary",
    "primary-fixed": "bg-primary-fixed",
    error: "bg-error",
  } as const;
  return (
    <div
      className={`absolute left-0 top-1.5 h-3.5 w-3.5 border-2 border-surface-container ${map[color]}`}
    />
  );
}

export default function CommandDashboard() {
  const { frame, connected, error, inject, reset } = useTelemetryStream();
  const [timeline, setTimeline] = useState<TimelineEv[]>([]);
  const prevAnomaly = useRef<boolean | null>(null);

  useEffect(() => {
    if (!frame) return;
    const was = prevAnomaly.current;
    prevAnomaly.current = frame.is_anomaly;
    if (was === null) return;
    if (frame.is_anomaly && !was) {
      const ts = frame.timestamp.slice(11, 19);
      const ev: TimelineEv = {
        time: ts,
        color: "error",
        title: "Anomaly confirmed",
        detail: `Score ${(frame.anomaly_score * 100).toFixed(1)}% · model ${frame.model_fallback ? "heuristic" : "IF"}`,
      };
      setTimeline((prev) => [ev, ...prev].slice(0, 12));
    }
    if (!frame.is_anomaly && was) {
      const ts = frame.timestamp.slice(11, 19);
      const ev: TimelineEv = {
        time: ts,
        color: "secondary",
        title: "Cleared",
        detail: "Telemetry within envelope",
      };
      setTimeline((prev) => [ev, ...prev].slice(0, 12));
    }
  }, [frame]);

  const chartData = useMemo(() => {
    if (frame?.chart?.length) return frame.chart;
    return [
      {
        i: 0,
        t: "…",
        it_rpm: 1200,
        physical_rpm: 1200,
        it_temp: 285,
        physical_temp: 285,
        it_pressure: 72,
        physical_pressure: 72,
        it_vibration: 0.12,
        physical_vibration: 0.12,
      },
    ];
  }, [frame]);

  const errPct = frame
    ? (frame.anomaly_score * 100).toFixed(1)
    : "—";

  const expHz = 432;
  const actHz = frame
    ? Math.round(400 + frame.physical_vibration_mms * 55 + frame.anomaly_score * 80)
    : 418;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm lg:text-base">
          <span
            className={`inline-flex items-center gap-2 border px-3 py-1.5 ${
              connected
                ? "border-secondary/40 bg-secondary/10 text-secondary"
                : "border-error/40 bg-error/10 text-error"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-secondary" : "bg-error"}`}
            />
            {connected ? "LIVE SSE" : "OFFLINE"}
          </span>
          {frame?.model_fallback ? (
            <span className="text-primary-fixed">ML fallback (train model)</span>
          ) : null}
          {error ? (
            <span className="text-error lg:max-w-xl lg:truncate">{error}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void inject()}
            className="border border-error/50 bg-error/20 px-4 py-2 font-label text-[11px] font-bold uppercase tracking-wider text-error hover:bg-error/30 lg:text-xs"
          >
            Inject attack
          </button>
          <button
            type="button"
            onClick={() => void reset()}
            className="border border-secondary/50 bg-secondary/15 px-4 py-2 font-label text-[11px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/25 lg:text-xs"
          >
            Reset plant
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          <div className="relative overflow-hidden border-l-2 border-secondary/40 bg-surface-container p-4 lg:p-5">
            <div className="font-label mb-3 text-xs uppercase tracking-widest text-secondary lg:text-sm">
              MOTION TELEMETRY
            </div>
            <LiveBarStack
              heights={frame?.bars.motion ?? []}
              palette={BAR_COLORS}
            />
            <div className="mt-2 flex justify-between font-mono text-xs text-on-surface-variant sm:text-sm">
              <span>P-01 ACTV</span>
              <span>
                {frame
                  ? `${frame.physical_vibration_mms.toFixed(2)} mm/s`
                  : "—"}
              </span>
            </div>
          </div>
          <div className="border-l-2 border-primary-fixed/40 bg-surface-container p-4 lg:p-5">
            <div className="font-label mb-3 text-xs uppercase tracking-widest text-primary-fixed lg:text-sm">
              THERMAL DELTA
            </div>
            <LiveBarStack
              heights={frame?.bars.thermal ?? []}
              palette={THERMAL_COLORS}
            />
            <div className="mt-2 flex justify-between font-mono text-xs text-on-surface-variant sm:text-sm">
              <span>CORE T-MOD</span>
              <span>
                {frame ? `${frame.physical_temp_c.toFixed(1)} °C` : "—"}
              </span>
            </div>
          </div>
          <div className="border-l-2 border-secondary/40 bg-surface-container p-4 sm:col-span-2 lg:col-span-1 lg:p-5">
            <div className="font-label mb-3 text-xs uppercase tracking-widest text-secondary lg:text-sm">
              VIBRATION SENSE
            </div>
            <LiveBarStack
              heights={frame?.bars.vibration ?? []}
              palette={BAR_COLORS}
            />
            <div className="mt-2 flex justify-between font-mono text-xs text-on-surface-variant sm:text-sm">
              <span>PERIMETER</span>
              <span className={frame?.is_anomaly ? "text-error" : "text-secondary"}>
                {frame?.is_anomaly ? "ALERT" : "NOMINAL"}
              </span>
            </div>
          </div>
        </div>
        <div
          className={`col-span-12 flex flex-col justify-between border-2 p-4 lg:col-span-4 lg:p-5 ${
            frame?.is_anomaly
              ? "border-error/60 bg-error-container/25"
              : "border-outline-variant/30 bg-surface-container-high/40"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-label text-xs uppercase tracking-widest text-error lg:text-sm">
                CRITICAL DIVERGENCE
              </div>
              <div className="font-headline mt-1 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                {errPct}% ERR
              </div>
            </div>
            <span
              className={`material-symbols-outlined shrink-0 text-3xl lg:text-4xl ${frame?.is_anomaly ? "animate-pulse text-error" : "text-on-surface-variant"}`}
            >
              warning
            </span>
          </div>
          <div className="mt-3 font-mono text-xs leading-relaxed text-error/90 sm:text-sm lg:mt-4 lg:text-base">
            {frame ? (
              <>
                [DIV] rpm {frame.divergences.div_rpm.toFixed(0)} · temp{" "}
                {frame.divergences.div_temp.toFixed(1)} · prs{" "}
                {frame.divergences.div_pressure.toFixed(1)} · vib{" "}
                {frame.divergences.div_vibration.toFixed(2)}
                <br />
                [MODE] {frame.mode.toUpperCase()} · conf{" "}
                {(frame.confidence * 100).toFixed(0)}%
              </>
            ) : (
              <>Awaiting telemetry…</>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <div className="flex min-h-[14rem] flex-col overflow-hidden bg-surface-container lg:min-h-0 lg:flex-1">
            <div className="flex items-center justify-between bg-surface-container-high px-4 py-2.5 lg:py-3">
              <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                SCADA LOG FEED
              </span>
              <span className="material-symbols-outlined text-sm text-secondary lg:text-base">
                terminal
              </span>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto p-4 font-mono text-xs sm:text-sm lg:max-h-none lg:flex-1 lg:text-base">
              {(frame?.scada ?? []).map((row, i) => (
                <div
                  key={`${row.t}-${i}`}
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
                <div className="text-on-surface-variant">Connecting…</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          <div className="border border-outline-variant/20 bg-surface-container p-3 lg:p-4">
            <div className="font-label mb-3 text-xs uppercase tracking-widest text-white lg:text-sm">
              IT vs PHYSICAL (synced charts)
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MiniSyncChart
                title="Pump / RPM"
                unit="RPM"
                dataKeyIt="it_rpm"
                dataKeyPhys="physical_rpm"
                data={chartData}
              />
              <MiniSyncChart
                title="Temperature"
                unit="°C"
                dataKeyIt="it_temp"
                dataKeyPhys="physical_temp"
                data={chartData}
              />
              <MiniSyncChart
                title="Pressure"
                unit="bar"
                dataKeyIt="it_pressure"
                dataKeyPhys="physical_pressure"
                data={chartData}
              />
              <MiniSyncChart
                title="Vibration"
                unit="mm/s"
                dataKeyIt="it_vibration"
                dataKeyPhys="physical_vibration"
                data={chartData}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
            <div className="relative flex min-h-[280px] flex-col overflow-hidden bg-surface-container lg:col-span-3 lg:min-h-[320px]">
              <div className="flex items-center justify-between bg-surface-container-high px-4 py-2.5">
                <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                  REACTOR CORE TOPOLOGY
                </span>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 bg-primary-fixed" />
                  <span className="h-2.5 w-2.5 bg-secondary" />
                </div>
              </div>
              <div className="relative flex flex-1 items-center justify-center bg-black/40 p-4 sm:p-8">
                <div className="relative aspect-square w-full max-w-md border border-outline-variant/25">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-36 w-36 animate-spin rounded-full border-4 border-dashed border-primary-fixed/25 sm:h-44 sm:w-44 lg:h-52 lg:w-52"
                      style={{ animationDuration: "22s" }}
                    />
                    <div className="absolute flex h-28 w-28 items-center justify-center rounded-full border border-secondary/45 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                      <div className="flex h-20 w-20 items-center justify-center bg-primary-fixed/10 sm:h-24 sm:w-24">
                        <span className="material-symbols-outlined fill text-3xl text-primary-fixed lg:text-4xl">
                          power
                        </span>
                      </div>
                    </div>
                    {frame?.is_anomaly ? (
                      <div className="absolute left-2 top-2 flex max-w-[92%] items-center gap-1 bg-error/90 px-2 py-1.5 font-mono text-[11px] text-on-error sm:left-4 sm:top-4 sm:text-xs lg:text-sm">
                        <span className="material-symbols-outlined text-sm">
                          warning
                        </span>
                        DIVERGENCE &gt; THRESHOLD
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-outline-variant/25" />
                  <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-outline-variant/25" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="flex min-h-[14rem] flex-col bg-surface-container lg:min-h-[11rem]">
                <div className="bg-surface-container-high px-4 py-2.5">
                  <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                    DIVERGENCE MATRIX (LIVE)
                  </span>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-2 p-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  {(frame?.matrix ?? Array.from({ length: 8 }, (_, i) => ({
                    label: `—${i}`,
                    value: "—",
                    ok: true,
                    raw: 0,
                  }))).map((cell, idx) => (
                    <div
                      key={`${cell.label}-${idx}`}
                      className={`flex flex-col items-center justify-center border-b-4 bg-surface-container-high p-2 transition-colors duration-500 lg:p-3 ${
                        cell.ok ? "border-secondary" : "border-error"
                      }`}
                    >
                      <span className="text-[10px] uppercase text-on-surface-variant sm:text-xs lg:text-sm">
                        {cell.label}
                      </span>
                      <span
                        className={`mt-1 font-mono text-sm sm:text-base lg:text-lg ${
                          cell.ok ? "text-white" : "font-bold text-error"
                        }`}
                      >
                        {cell.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-[12rem] flex-col overflow-hidden bg-surface-container lg:flex-1">
                <div className="bg-surface-container-high px-4 py-2.5">
                  <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                    FREQ ANALYSIS
                  </span>
                </div>
                <div className="relative flex flex-1 items-center justify-center p-4">
                  <div
                    className="relative h-32 w-32 rounded-full border border-secondary/25 transition-transform duration-500 sm:h-36 sm:w-36 lg:h-40 lg:w-40"
                    style={{
                      transform: `rotate(${frame ? frame.anomaly_score * 18 : 0}deg)`,
                    }}
                  >
                    <div className="absolute inset-0 rotate-45 border border-secondary/45" />
                    <div className="absolute inset-0 -rotate-45 border border-secondary/45" />
                    <div
                      className="absolute inset-2 border-2 border-secondary bg-secondary/10 transition-all duration-500"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 90% 20%, 100% 50%, 70% 90%, 50% 100%, 10% 80%, 0% 50%, 20% 20%)",
                        opacity: frame ? 0.45 + frame.anomaly_score * 0.55 : 0.35,
                      }}
                    />
                    <div
                      className="absolute inset-2 border border-dashed border-white/35"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)",
                      }}
                    />
                  </div>
                  <div className="absolute bottom-2 left-4 font-mono text-xs text-on-surface-variant sm:text-sm">
                    EXP: {expHz}Hz
                    <br />
                    ACT: {actHz}Hz
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[220px] flex-col overflow-hidden bg-surface-container lg:min-h-[260px]">
            <div className="bg-surface-container-high px-4 py-2.5">
              <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                EVENT CHRONOLOGY
              </span>
            </div>
            <div className="relative flex-1 space-y-6 overflow-y-auto p-4 lg:p-5">
              <div className="absolute bottom-4 left-[23px] top-4 w-px bg-outline-variant/35" />
              {timeline.map((ev) => (
                <div key={ev.time + ev.title} className="relative pl-9">
                  <TimelineDot color={ev.color} />
                  <div
                    className={`font-mono text-xs sm:text-sm ${
                      ev.color === "secondary"
                        ? "text-secondary"
                        : ev.color === "primary-fixed"
                          ? "text-primary-fixed"
                          : "text-error"
                    }`}
                  >
                    {ev.time}
                  </div>
                  <div className="text-sm font-bold uppercase text-white sm:text-base">
                    {ev.title}
                  </div>
                  <div className="text-xs text-on-surface-variant sm:text-sm">
                    {ev.detail}
                  </div>
                </div>
              ))}
              {!timeline.length ? (
                <p className="pl-9 text-sm text-on-surface-variant">
                  State changes from the live model will appear here.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
