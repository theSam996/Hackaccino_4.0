"use client";

import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { useEffect, useRef, useState } from "react";

/**
 * Full-screen plant shutdown overlay.
 *
 * Behaviour:
 *  1. When `plant_shutdown` first becomes true, a short delay (~2.5 s) runs
 *     so the user sees the error climb to 99 %+ on the dashboard.
 *  2. Then the overlay fades in, covering the entire viewport (including
 *     sidebar & header) with a dark backdrop.
 *  3. Clicking "Restart Systems" calls `reset()` which clears the backend
 *     shutdown flag, and the overlay fades out.
 */
export function PlantShutdownOverlay() {
  const { frame, reset } = useTelemetryStream();
  const [phase, setPhase] = useState<"hidden" | "delay" | "visible">("hidden");
  const [shutdownTime, setShutdownTime] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isShutdown = Boolean(frame?.plant_shutdown);

  // Detect shutdown transition → start delay → show overlay
  useEffect(() => {
    if (isShutdown && phase === "hidden") {
      setPhase("delay");
      setShutdownTime(
        new Date().toLocaleTimeString("en-GB", { hour12: false }),
      );
      timerRef.current = setTimeout(() => {
        setPhase("visible");
      }, 2500); // 2.5s delay so error ramp is visible
    }

    if (!isShutdown && phase !== "hidden") {
      // Reset cleared — hide overlay
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("hidden");
      setShutdownTime("");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isShutdown, phase]);

  // Lock body scroll when overlay is visible
  useEffect(() => {
    if (phase === "visible") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-700 ${
        phase === "visible"
          ? "bg-black/90 backdrop-blur-md opacity-100"
          : "bg-transparent opacity-0 pointer-events-none"
      }`}
    >
      {phase === "visible" && (
        <div className="mx-4 flex max-w-2xl animate-[scaleIn_0.5s_ease-out_both] flex-col items-center gap-8 text-center">
          {/* Flashing warning icon */}
          <div className="relative">
            <span className="material-symbols-outlined animate-pulse text-[80px] text-error sm:text-[100px] lg:text-[120px]">
              emergency_home
            </span>
            {/* Glow ring */}
            <div className="absolute inset-0 -m-4 animate-ping rounded-full border-2 border-error/30" />
          </div>

          {/* Title */}
          <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-wider text-error sm:text-4xl lg:text-5xl">
              PLANT SHUTDOWN
            </h2>
            <p className="mt-2 font-label text-sm uppercase tracking-widest text-error/70 sm:text-base">
              Emergency SCRAM Protocol Activated
            </p>
          </div>

          {/* Info box */}
          <div className="w-full max-w-md border border-error/30 bg-error/10 p-5">
            <div className="space-y-3 font-mono text-xs text-stone-300 sm:text-sm">
              <div className="flex items-center justify-between border-b border-error/20 pb-2">
                <span className="text-stone-500">STATUS</span>
                <span className="font-bold text-error">ALL SYSTEMS HALTED</span>
              </div>
              <div className="flex items-center justify-between border-b border-error/20 pb-2">
                <span className="text-stone-500">TRIGGER</span>
                <span className="text-white">ANOMALY ≥ 99%</span>
              </div>
              <div className="flex items-center justify-between border-b border-error/20 pb-2">
                <span className="text-stone-500">SCRAM TIME</span>
                <span className="text-white">{shutdownTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">ACTION</span>
                <span className="text-primary-fixed">
                  AUTO-SHUTDOWN TO PREVENT DAMAGE
                </span>
              </div>
            </div>
          </div>

          {/* Sensor flatline indicator */}
          <div className="flex w-full max-w-md items-center gap-3 px-2">
            <div className="h-px flex-1 bg-error/40" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-error/60">
              ALL SENSORS FLATLINED
            </span>
            <div className="h-px flex-1 bg-error/40" />
          </div>

          {/* Restart button */}
          <button
            type="button"
            onClick={() => void reset()}
            className="group relative mt-2 overflow-hidden border-2 border-secondary/60 bg-secondary/10 px-8 py-3.5 font-label text-sm font-bold uppercase tracking-wider text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary/25 hover:shadow-[0_0_30px_rgba(94,212,255,0.2)] sm:text-base"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">
                restart_alt
              </span>
              Restart Systems
            </span>
          </button>

          <p className="max-w-sm font-mono text-[10px] leading-relaxed text-stone-600 sm:text-xs">
            Restarting will clear the shutdown flag, restore sensor baselines,
            and return the plant to normal operations.
          </p>
        </div>
      )}
    </div>
  );
}
