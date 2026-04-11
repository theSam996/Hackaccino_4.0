"use client";

import {
  SITE_ZONES,
  useOperatorPreferences,
  type SiteZoneId,
} from "@/contexts/OperatorPreferencesContext";

type Variant = "header" | "mobile" | "footer";

function zoneButtonClass(active: boolean, variant: Variant) {
  const base =
    "shrink-0 whitespace-nowrap rounded-sm border px-2 py-1 font-headline font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60";
  if (variant === "header") {
    return `${base} text-sm lg:text-base ${
      active
        ? "border-blue-400/80 bg-blue-500/15 text-blue-400"
        : "border-transparent text-stone-400 hover:border-white/10 hover:text-white"
    }`;
  }
  if (variant === "mobile") {
    return `${base} text-[10px] uppercase tracking-wide sm:text-xs ${
      active
        ? "border-blue-400/80 bg-blue-500/10 text-blue-400"
        : "border-transparent text-stone-500 hover:text-stone-300"
    }`;
  }
  return `${base} text-[10px] uppercase tracking-wide sm:text-xs ${
    active
      ? "border-secondary/60 bg-secondary/15 text-secondary"
      : "border-outline-variant/25 text-on-surface-variant hover:border-secondary/30 hover:text-white"
  }`;
}

export function SiteZoneControls({
  variant,
  className = "",
  zones = SITE_ZONES,
}: {
  variant: Variant;
  className?: string;
  /** Omit entries (e.g. hide “All” in the footer only). */
  zones?: readonly { id: SiteZoneId; label: string }[];
}) {
  const { prefs, setZone } = useOperatorPreferences();

  return (
    <div
      className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}
      role="tablist"
      aria-label="Site zone focus"
    >
      {zones.map(({ id, label }) => {
        const active = prefs.zone === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={zoneButtonClass(active, variant)}
            onClick={() => setZone(id as SiteZoneId)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
