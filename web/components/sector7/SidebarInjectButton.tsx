"use client";

import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function SidebarInjectButton() {
  const { inject } = useTelemetryStream();

  return (
    <button
      type="button"
      className="w-full bg-white py-3 font-label text-xs font-bold uppercase tracking-wider text-on-primary transition-transform hover:opacity-90 active:scale-[0.98] lg:text-sm"
      onClick={() => void inject()}
    >
      SYSTEM OVERRIDE
    </button>
  );
}
