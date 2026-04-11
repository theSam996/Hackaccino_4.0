"use client";

import Link from "next/link";
import { useState } from "react";

export function HeaderActions() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="relative flex gap-0.5 sm:gap-2">
      <button
        type="button"
        className="p-2 text-stone-400 transition-colors hover:text-white"
        aria-label="Notifications"
        aria-expanded={notifOpen}
        onClick={() => setNotifOpen((o) => !o)}
      >
        <span className="material-symbols-outlined text-sm">
          notifications_active
        </span>
      </button>
      {notifOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default lg:hidden"
            aria-label="Dismiss"
            onClick={() => setNotifOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] border border-white/10 bg-stone-900/98 p-3 text-left shadow-xl backdrop-blur-md">
            <div className="font-label text-[10px] uppercase tracking-widest text-stone-500">
              Notifications
            </div>
            <p className="mt-2 font-mono text-[10px] text-stone-400">
              No queued items. Alarms still surface on Command when the model
              fires.
            </p>
            <button
              type="button"
              className="mt-2 font-mono text-[10px] text-secondary hover:underline"
              onClick={() => setNotifOpen(false)}
            >
              Dismiss
            </button>
          </div>
        </>
      ) : null}
      <Link
        href="/settings"
        className="p-2 text-stone-400 transition-colors hover:text-white"
        aria-label="Settings"
        onClick={() => setNotifOpen(false)}
      >
        <span className="material-symbols-outlined text-sm">
          admin_panel_settings
        </span>
      </Link>
    </div>
  );
}
