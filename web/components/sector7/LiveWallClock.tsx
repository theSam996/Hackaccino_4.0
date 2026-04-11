"use client";

import { useEffect, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatNow(includeMs: boolean) {
  const d = new Date();
  const hms = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  if (!includeMs) return hms;
  return `${hms}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

type LiveWallClockProps = {
  className?: string;
  /** Smaller tick interval for millisecond feel (still updates ~60fps capped to 250ms for perf) */
  subsecond?: boolean;
};

export function LiveWallClock({
  className = "",
  subsecond = false,
}: LiveWallClockProps) {
  const [now, setNow] = useState(() => formatNow(subsecond));

  useEffect(() => {
    const ms = subsecond ? 250 : 1000;
    const id = window.setInterval(() => setNow(formatNow(subsecond)), ms);
    return () => window.clearInterval(id);
  }, [subsecond]);

  return (
    <time
      dateTime={new Date().toISOString()}
      className={`font-mono tabular-nums tracking-tight ${className}`}
      suppressHydrationWarning
    >
      {now}
    </time>
  );
}
