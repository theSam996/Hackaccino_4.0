"use client";

import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { useEffect, useRef, useState } from "react";

/**
 * ScannerWarningOverlay
 *
 * A dramatic full-screen scanner / threat-detection visual that activates
 * when the anomaly score crosses 40 % and intensifies as the score climbs
 * toward the 99 % auto-shutdown threshold.
 *
 * Visual elements:
 *  – Dark translucent backdrop that deepens with severity
 *  – Animated horizontal scan-line sweeping top-to-bottom
 *  – Pulsing corner brackets like a targeting reticle
 *  – Rising percentage readout in the centre
 *  – Threat-level label (ELEVATED → CRITICAL → IMMINENT)
 *  – Horizontal warning bars that fill proportionally
 *  – Flashing border at high severity
 *
 * The overlay disappears once the plant_shutdown flag takes over (the
 * PlantShutdownOverlay replaces this one).
 */

const SCANNER_THRESHOLD = 0.40; // 40 % — scanner appears
const CRITICAL_THRESHOLD = 0.70; // 70 % — ramps to critical visuals

function threatLevel(score: number) {
  if (score >= 0.90) return { label: "IMMINENT", color: "text-red-400" };
  if (score >= CRITICAL_THRESHOLD) return { label: "CRITICAL", color: "text-orange-400" };
  return { label: "ELEVATED", color: "text-amber-400" };
}

export function ScannerWarningOverlay() {
  const { frame } = useTelemetryStream();
  const [visible, setVisible] = useState(false);
  const prevVisible = useRef(false);

  const score = frame?.anomaly_score ?? 0;
  const isShutdown = Boolean(frame?.plant_shutdown);
  const shouldShow = score >= SCANNER_THRESHOLD && !isShutdown;

  useEffect(() => {
    if (shouldShow && !prevVisible.current) {
      setVisible(true);
    }
    if (!shouldShow && prevVisible.current) {
      setVisible(false);
    }
    prevVisible.current = shouldShow;
  }, [shouldShow]);

  if (!visible) return null;

  const pct = Math.min(100, score * 100);
  const severity = Math.min(1, (score - SCANNER_THRESHOLD) / (1 - SCANNER_THRESHOLD)); // 0..1
  const threat = threatLevel(score);

  // Intensify: backdrop opacity, border flash speed, scan-line speed
  const backdropOpacity = 0.25 + severity * 0.35; // 0.25 → 0.60
  const borderAlpha = severity > 0.5 ? 0.6 + severity * 0.4 : 0;
  const scanDuration = Math.max(0.8, 2.5 - severity * 1.7); // 2.5s → 0.8s

  return (
    <div
      className="fixed inset-0 z-[9990] pointer-events-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Dark backdrop — deepens with severity */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}
      />

      {/* Scan line — sweeps top-to-bottom */}
      <div
        className="scanner-line absolute left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255, 60, 60, ${0.3 + severity * 0.5}) 20%, rgba(255, 60, 60, ${0.6 + severity * 0.4}) 50%, rgba(255, 60, 60, ${0.3 + severity * 0.5}) 80%, transparent 100%)`,
          boxShadow: `0 0 ${12 + severity * 20}px rgba(255, 60, 60, ${0.3 + severity * 0.4})`,
          animationDuration: `${scanDuration}s`,
        }}
      />
      {/* Second scan line (offset) */}
      <div
        className="scanner-line scanner-line-delay absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255, 120, 60, ${0.15 + severity * 0.2}) 30%, rgba(255, 120, 60, ${0.3 + severity * 0.3}) 50%, rgba(255, 120, 60, ${0.15 + severity * 0.2}) 70%, transparent 100%)`,
          animationDuration: `${scanDuration * 1.3}s`,
        }}
      />

      {/* Pulsing border — only at high severity */}
      {severity > 0.5 && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            border: `2px solid rgba(255, 60, 60, ${borderAlpha})`,
            boxShadow: `inset 0 0 ${40 + severity * 60}px rgba(255, 0, 0, ${severity * 0.08})`,
          }}
        />
      )}

      {/* Corner reticle brackets */}
      <div className="absolute inset-0">
        {/* Top-left */}
        <div className="absolute left-6 top-20 lg:left-72 lg:top-20">
          <div className="h-12 w-12 border-l-2 border-t-2 border-red-500/60 sm:h-16 sm:w-16" />
        </div>
        {/* Top-right */}
        <div className="absolute right-6 top-20">
          <div className="h-12 w-12 border-r-2 border-t-2 border-red-500/60 sm:h-16 sm:w-16" />
        </div>
        {/* Bottom-left */}
        <div className="absolute bottom-10 left-6 lg:left-72">
          <div className="h-12 w-12 border-b-2 border-l-2 border-red-500/60 sm:h-16 sm:w-16" />
        </div>
        {/* Bottom-right */}
        <div className="absolute bottom-10 right-6">
          <div className="h-12 w-12 border-b-2 border-r-2 border-red-500/60 sm:h-16 sm:w-16" />
        </div>
      </div>

      {/* Centre HUD */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Threat level label */}
          <div className={`font-label text-xs uppercase tracking-[0.3em] sm:text-sm ${threat.color}`}>
            ▲ THREAT LEVEL: {threat.label} ▲
          </div>

          {/* Big percentage */}
          <div
            className="font-headline text-5xl font-black tabular-nums tracking-wider sm:text-7xl lg:text-8xl"
            style={{
              color: `rgb(${Math.round(255)}, ${Math.round(80 - severity * 60)}, ${Math.round(60 - severity * 50)})`,
              textShadow: `0 0 ${20 + severity * 40}px rgba(255, 60, 60, ${0.4 + severity * 0.4})`,
            }}
          >
            {pct.toFixed(1)}%
          </div>

          {/* Sub label */}
          <div className="font-mono text-[10px] uppercase tracking-widest text-red-400/80 sm:text-xs">
            ANOMALY DIVERGENCE DETECTED
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 w-48 overflow-hidden bg-white/10 sm:h-2 sm:w-64">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, #f59e0b ${0}%, #ef4444 ${50}%, #dc2626 ${100}%)`,
                boxShadow: `0 0 8px rgba(239, 68, 68, ${0.5 + severity * 0.5})`,
              }}
            />
            {/* Animated shimmer */}
            <div
              className="scanner-shimmer absolute inset-y-0 w-8"
              style={{ left: `${pct - 5}%` }}
            />
          </div>

          {/* Scrolling telemetry readout */}
          {frame && (
            <div className="mt-2 max-w-xs space-y-1 text-center font-mono text-[9px] leading-snug text-red-400/60 sm:max-w-sm sm:text-[10px]">
              <div>
                [SIG] RPM Δ{frame.divergences.div_rpm.toFixed(0)} · TEMP Δ{frame.divergences.div_temp.toFixed(1)}°C · PRS Δ{frame.divergences.div_pressure.toFixed(1)}bar
              </div>
              <div>
                [NET] CONF {(frame.confidence * 100).toFixed(0)}% · RAW {(frame.raw_score * 100).toFixed(1)}% · INT {(frame.anomaly_score * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side warning bars (left) */}
      <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 flex-col gap-1 lg:left-[17.5rem] lg:flex">
        {Array.from({ length: 8 }).map((_, i) => {
          const barActive = severity > i / 8;
          return (
            <div
              key={i}
              className="h-4 transition-all duration-300"
              style={{
                width: barActive ? `${12 + (8 - i) * 3}px` : "4px",
                backgroundColor: barActive
                  ? `rgba(255, ${60 + i * 15}, ${40 + i * 10}, ${0.5 + severity * 0.5})`
                  : "rgba(255, 255, 255, 0.05)",
              }}
            />
          );
        })}
      </div>

      {/* Side warning bars (right) */}
      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-1 lg:flex">
        {Array.from({ length: 8 }).map((_, i) => {
          const barActive = severity > i / 8;
          return (
            <div
              key={i}
              className="h-4 transition-all duration-300"
              style={{
                width: barActive ? `${12 + (8 - i) * 3}px` : "4px",
                backgroundColor: barActive
                  ? `rgba(255, ${60 + i * 15}, ${40 + i * 10}, ${0.5 + severity * 0.5})`
                  : "rgba(255, 255, 255, 0.05)",
              }}
            />
          );
        })}
      </div>

      {/* Bottom ticker */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest sm:text-[10px] ${threat.color}`}>
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          SCANNING PHYSICAL BUS DIVERGENCE
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        </div>
      </div>
    </div>
  );
}
