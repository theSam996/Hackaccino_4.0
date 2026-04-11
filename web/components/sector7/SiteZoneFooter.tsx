"use client";

import { SiteZoneControls } from "@/components/sector7/SiteZoneControls";
import {
  SITE_ZONES_NO_ALL,
  useOperatorPreferences,
} from "@/contexts/OperatorPreferencesContext";

export function SiteZoneFooter() {
  const { prefs } = useOperatorPreferences();
  const label =
    prefs.zone === "all"
      ? "All zones in scope"
      : `Focus: ${prefs.zone.replace(/-/g, " ").toUpperCase()}`;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-stone-950/95 px-3 py-2 backdrop-blur-md sm:px-4 lg:left-64">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-label text-[9px] uppercase tracking-widest text-stone-500">
          Zone routing · {label}
        </div>
        <SiteZoneControls variant="footer" zones={SITE_ZONES_NO_ALL} />
      </div>
    </footer>
  );
}
