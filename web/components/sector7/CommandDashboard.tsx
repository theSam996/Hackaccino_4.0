"use client";

import { ReactorTopologySchematic } from "@/components/sector7/ReactorTopologySchematic";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import {
  pressureSeries,
  rpmSeries,
  syntheticChartHistory,
  tempSeries,
  type MetricSeriesRow,
  vibrationSeries,
} from "@/lib/chartSeries";
import Link from "next/link";
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

const CHART_VARIANTS = {
  rpm: {
    shell: "border-l-[3px] border-l-secondary border-y border-r border-outline-variant/20 bg-secondary/[0.07]",
    titleAccent: "text-secondary",
    unitClass: "font-mono text-secondary",
    grid: "rgba(94, 212, 255, 0.14)",
    it: "#94a3b8",
    phys: "#5ed4ff",
    delta: "rgba(255, 180, 171, 0.95)",
    itWidth: 2,
    physWidth: 2.5,
    itDash: undefined as string | undefined,
    physDash: undefined as string | undefined,
    itType: "monotone" as const,
    physType: "monotone" as const,
    subtitle: "Shaft / drive",
    formatDeltaTick: (v: number) =>
      Math.abs(v) >= 500 ? v.toFixed(0) : v.toFixed(1),
  },
  temp: {
    shell: "border-l-[3px] border-l-primary-fixed border-y border-r border-outline-variant/20 bg-primary-fixed/[0.06]",
    titleAccent: "text-primary-fixed",
    unitClass: "font-mono text-primary-fixed",
    grid: "rgba(251, 191, 36, 0.12)",
    it: "#fcd34d",
    phys: "#ea580c",
    delta: "rgba(255, 180, 171, 0.95)",
    itWidth: 2,
    physWidth: 2.5,
    itDash: "6 4",
    physDash: undefined,
    itType: "monotone" as const,
    physType: "basis" as const,
    subtitle: "Core loop",
    formatDeltaTick: (v: number) => v.toFixed(1),
  },
  pressure: {
    shell: "border-l-[3px] border-l-[#a78bfa] border-y border-r border-outline-variant/20 bg-[#a78bfa]/[0.07]",
    titleAccent: "text-[#c4b5fd]",
    unitClass: "font-mono text-[#c4b5fd]",
    grid: "rgba(167, 139, 250, 0.14)",
    it: "#c4b5fd",
    phys: "#a78bfa",
    delta: "rgba(255, 180, 171, 0.95)",
    itWidth: 2,
    physWidth: 2,
    itDash: undefined,
    physDash: "4 3",
    itType: "stepAfter" as const,
    physType: "monotone" as const,
    subtitle: "Steam / RCS",
    formatDeltaTick: (v: number) => v.toFixed(1),
  },
  vibration: {
    shell: "border-l-[3px] border-l-emerald-400/90 border-y border-r border-outline-variant/20 bg-emerald-500/[0.06]",
    titleAccent: "text-emerald-300",
    unitClass: "font-mono text-emerald-300",
    grid: "rgba(52, 211, 153, 0.12)",
    it: "#86efac",
    phys: "#34d399",
    delta: "rgba(255, 180, 171, 0.95)",
    itWidth: 1.8,
    physWidth: 2.5,
    itDash: "2 3",
    physDash: undefined,
    itType: "linear" as const,
    physType: "monotone" as const,
    subtitle: "Bearings / casing",
    formatDeltaTick: (v: number) => v.toFixed(3),
  },
} as const;

type ChartVariant = keyof typeof CHART_VARIANTS;

function MiniSyncChart({
  title,
  unit,
  data,
  variant,
}: {
  title: string;
  unit: string;
  data: MetricSeriesRow[];
  variant: ChartVariant;
}) {
  const v = CHART_VARIANTS[variant];
  return (
    <div className={`p-2 ${v.shell}`}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <div>
          <div
            className={`font-label text-[11px] uppercase tracking-widest lg:text-xs ${v.titleAccent}`}
          >
            {title}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant/80">
            {v.subtitle}
          </div>
        </div>
        <span className={`text-[10px] ${v.unitClass}`}>({unit})</span>
      </div>
      <div className="h-[200px] w-full min-w-[1px] sm:h-[220px] lg:h-[248px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1}>
          <LineChart
            data={data}
            margin={{ top: 6, right: 4, left: 2, bottom: 2 }}
          >
            <CartesianGrid stroke={v.grid} vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#9ca3af" }} />
            <YAxis
              yAxisId="left"
              width={44}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              domain={["auto", "auto"]}
              label={{
                value: "IT / OT",
                angle: -90,
                position: "insideLeft",
                fill: "#6b7280",
                fontSize: 9,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={40}
              tick={{ fontSize: 9, fill: "#fca5a5" }}
              tickFormatter={v.formatDeltaTick}
              domain={["auto", "auto"]}
              label={{
                value: "Δ",
                angle: 90,
                position: "insideRight",
                fill: "#f87171",
                fontSize: 9,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#1c1b1b",
                border: "1px solid #474747",
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const raw = value ?? 0;
                const n = typeof raw === "number" ? raw : Number(raw);
                const label = String(name ?? "");
                if (!Number.isFinite(n)) return [String(raw), label];
                if (label.includes("Δ")) return [v.formatDeltaTick(n), label];
                if (variant === "rpm") return [n.toFixed(0), label];
                if (variant === "vibration") return [n.toFixed(3), label];
                return [n.toFixed(2), label];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              yAxisId="left"
              type={v.itType}
              dataKey="it"
              name="IT (spoofed)"
              stroke={v.it}
              strokeWidth={v.itWidth}
              strokeDasharray={v.itDash}
              dot={false}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="left"
              type={v.physType}
              dataKey="phys"
              name="Physical OT"
              stroke={v.phys}
              strokeWidth={v.physWidth}
              strokeDasharray={v.physDash}
              dot={false}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="delta"
              name="Δ (phys−IT)"
              stroke={v.delta}
              strokeWidth={1.25}
              strokeDasharray="3 3"
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
  const [injectCue, setInjectCue] = useState(false);
  const prevAnomaly = useRef<boolean | null>(null);
  const prevShutdown = useRef<boolean>(false);

  useEffect(() => {
    if (!frame) return;
    const was = prevAnomaly.current;
    prevAnomaly.current = frame.is_anomaly;

    // Detect auto-shutdown transition
    const isShutdown = Boolean(frame.plant_shutdown);
    if (isShutdown && !prevShutdown.current) {
      const ts = frame.timestamp.slice(11, 19);
      const ev: TimelineEv = {
        time: ts,
        color: "error",
        title: "⚠ EMERGENCY SCRAM — PLANT SHUTDOWN",
        detail: `Auto-shutdown triggered at ${(frame.anomaly_score * 100).toFixed(1)}% anomaly · all systems halted`,
      };
      setTimeline((prev) => [ev, ...prev].slice(0, 12));
    }
    prevShutdown.current = isShutdown;

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

  useEffect(() => {
    if (frame?.mode === "attack") setInjectCue(false);
  }, [frame?.mode]);

  useEffect(() => {
    if (!injectCue) return;
    const t = window.setTimeout(() => setInjectCue(false), 6000);
    return () => window.clearTimeout(t);
  }, [injectCue]);

  /** Prefer live SSE history; otherwise multi-point synthetic curves so charts are not flat duplicates. */
  const chartSource = useMemo(() => {
    const c = frame?.chart;
    if (c && c.length >= 2) return c;
    return syntheticChartHistory();
  }, [frame?.chart]);

  const rpmData = useMemo(() => rpmSeries(chartSource), [chartSource]);
  const tempData = useMemo(() => tempSeries(chartSource), [chartSource]);
  const pressureData = useMemo(() => pressureSeries(chartSource), [chartSource]);
  const vibrationData = useMemo(() => vibrationSeries(chartSource), [chartSource]);

  const errPct = frame
    ? (frame.anomaly_score * 100).toFixed(1)
    : "—";

  const expHz = 432;
  const actHz = frame
    ? Math.round(400 + frame.physical_vibration_mms * 55 + frame.anomaly_score * 80)
    : 418;

  /** Payload / model: next SSE tick sets mode; injectCue flashes the topology immediately on click. */
  const showAttack =
    injectCue ||
    frame?.mode === "attack" ||
    Boolean(frame?.is_anomaly);

  const showShutdown = Boolean(frame?.plant_shutdown);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm lg:text-base">
          <span
            className={`inline-flex items-center gap-2 border px-3 py-1.5 ${
              showShutdown
                ? "border-error bg-error/20 text-error"
                : connected
                  ? "border-secondary/40 bg-secondary/10 text-secondary"
                  : "border-error/40 bg-error/10 text-error"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                showShutdown
                  ? "bg-error"
                  : connected
                    ? "animate-pulse bg-secondary"
                    : "bg-error"
              }`}
            />
            {showShutdown ? "SCRAMMED" : connected ? "LIVE SSE" : "OFFLINE"}
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
            disabled={showShutdown}
            onClick={() => {
              setInjectCue(true);
              void inject();
            }}
            className={`border px-4 py-2 font-label text-[11px] font-bold uppercase tracking-wider lg:text-xs ${
              showShutdown
                ? "cursor-not-allowed border-outline-variant/30 bg-surface-container text-on-surface-variant/40"
                : "border-error/50 bg-error/20 text-error hover:bg-error/30"
            }`}
          >
            Inject attack
          </button>
          <button
            type="button"
            onClick={() => {
              setInjectCue(false);
              void reset();
            }}
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
              <span className={showAttack ? "text-error" : "text-secondary"}>
                {showAttack ? "ALERT" : "NOMINAL"}
              </span>
            </div>
          </div>
        </div>
        <div
          className={`col-span-12 flex flex-col justify-between border-2 p-4 lg:col-span-4 lg:p-5 ${
            showAttack
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
              className={`material-symbols-outlined shrink-0 text-3xl lg:text-4xl ${showAttack ? "animate-pulse text-error" : "text-on-surface-variant"}`}
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
                [MODE] {(frame.mode ?? "—").toUpperCase()} · conf{" "}
                {(frame.confidence * 100).toFixed(0)}%
              </>
            ) : (
              <>Awaiting telemetry…</>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="col-span-12 flex flex-col gap-4">
          <div className="border border-outline-variant/20 bg-surface-container p-3 lg:p-4">
            <div className="font-label mb-3 text-xs uppercase tracking-widest text-white lg:text-sm">
              IT vs PHYSICAL (per-metric history)
            </div>
            <p className="mb-3 font-mono text-[10px] text-on-surface-variant sm:text-[11px]">
              Each panel plots only that signal pair from the live buffer plus Δ (physical−IT) on
              the right axis. SCADA lines live on the{" "}
              <Link
                href="/log"
                className="text-secondary underline decoration-secondary/50 underline-offset-2 hover:text-white"
              >
                Log
              </Link>{" "}
              page.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MiniSyncChart
                variant="rpm"
                title="Pump / RPM"
                unit="RPM"
                data={rpmData}
              />
              <MiniSyncChart
                variant="temp"
                title="Temperature"
                unit="°C"
                data={tempData}
              />
              <MiniSyncChart
                variant="pressure"
                title="Pressure"
                unit="bar"
                data={pressureData}
              />
              <MiniSyncChart
                variant="vibration"
                title="Vibration"
                unit="mm/s"
                data={vibrationData}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
            <div className="relative flex min-h-[280px] flex-col overflow-hidden bg-surface-container lg:col-span-3 lg:min-h-[320px]">
              <div className="flex shrink-0 items-center justify-between bg-surface-container-high px-4 py-2.5">
                <span className="font-label text-xs uppercase tracking-widest text-white lg:text-sm">
                  REACTOR CORE TOPOLOGY
                </span>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 bg-primary-fixed" />
                  <span className="h-2.5 w-2.5 bg-secondary" />
                </div>
              </div>
              <div className="relative min-h-0 flex-1 bg-[#0a0a0c]">
                <ReactorTopologySchematic
                  fillContainer
                  attackActive={showAttack}
                />
                {showAttack ? (
                  <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex max-w-[95%] -translate-x-1/2 items-center gap-1 bg-error/90 px-2 py-1 font-mono text-[10px] text-on-error shadow-lg sm:text-xs">
                    <span className="material-symbols-outlined text-sm">
                      warning
                    </span>
                    {frame?.is_anomaly
                      ? "Model: divergence above threshold"
                      : "Attack payload live — physical bus diverging"}
                  </div>
                ) : null}
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
                <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden p-4">
                  <div className="relative isolate h-32 w-32 shrink-0 overflow-hidden rounded-full border border-secondary/25 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                    <div
                      className="absolute inset-[5%] flex items-center justify-center overflow-hidden rounded-full"
                      style={{
                        transform: `rotate(${frame ? frame.anomaly_score * 18 : 0}deg)`,
                        transition: "transform 0.5s ease-out",
                      }}
                    >
                      <div className="relative h-full w-full">
                        <div className="absolute inset-0 rotate-45 border border-secondary/45" />
                        <div className="absolute inset-0 -rotate-45 border border-secondary/45" />
                        <div
                          className="absolute inset-[10%] border-2 border-secondary bg-secondary/10 transition-all duration-500"
                          style={{
                            clipPath:
                              "polygon(50% 0%, 90% 20%, 100% 50%, 70% 90%, 50% 100%, 10% 80%, 0% 50%, 20% 20%)",
                            opacity: frame ? 0.45 + frame.anomaly_score * 0.55 : 0.35,
                          }}
                        />
                        <div
                          className="absolute inset-[10%] border border-dashed border-white/35"
                          style={{
                            clipPath:
                              "polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="max-w-full text-center font-mono text-[10px] leading-snug text-on-surface-variant sm:text-xs">
                    EXP: {expHz}Hz · ACT: {actHz}Hz
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
