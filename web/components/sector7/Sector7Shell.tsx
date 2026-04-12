"use client";

import {
  OperatorPreferencesProvider,
  SITE_ZONES_NO_ALL,
} from "@/contexts/OperatorPreferencesContext";
import { TelemetryProvider } from "@/contexts/TelemetryContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BlueprintBackdrop } from "./BlueprintBackdrop";
import { HeaderActions } from "./HeaderActions";
import { HeaderTelemetryStatus } from "./HeaderTelemetryStatus";
import { LiveGlobalStrip } from "./LiveGlobalStrip";
import { PRIMARY_NAV, SECONDARY_NAV, titleForPath } from "./nav-config";
import { SidebarInjectButton } from "./SidebarInjectButton";
import { SiteZoneControls } from "./SiteZoneControls";
import { SiteZoneFooter } from "./SiteZoneFooter";
import { PlantShutdownOverlay } from "./PlantShutdownOverlay";

function NavLink({
  href,
  label,
  icon,
  active,
  compact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pad = compact ? "py-2 pl-2" : "py-3 pl-4";
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center ${pad} font-label text-xs uppercase tracking-wider transition-colors hover:bg-white/5 lg:text-sm ${
        active
          ? "border-l-2 border-orange-500 text-orange-500"
          : "text-stone-500 hover:text-stone-300"
      }`}
    >
      <span className="material-symbols-outlined mr-3 text-sm">{icon}</span>
      {label}
    </Link>
  );
}

function Sector7ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sectionTitle = titleForPath(pathname);

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      <aside
        id="sector7-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[min(16rem,85vw)] max-w-full flex-col border-r border-white/10 bg-stone-900/95 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0"
        }`}
      >
        <div className="flex items-start justify-between gap-2 p-4 sm:p-6 lg:block">
          <div>
            <div className="text-xl font-bold tracking-tighter text-white">
              SECTOR-7
            </div>
            <div className="font-label text-[10px] uppercase tracking-wider text-stone-500">
              OBSIDIAN SENTINEL
            </div>
          </div>
          <button
            type="button"
            className="p-2 text-stone-400 lg:hidden"
            aria-label="Close sidebar"
            onClick={close}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <nav className="mt-2 flex-1 overflow-y-auto lg:mt-4">
          <div className="space-y-1 pr-1">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
                onNavigate={close}
              />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/5 px-4 py-4 sm:px-6 sm:py-6">
          <SidebarInjectButton />
        </div>

        <div className="space-y-1 p-3 sm:p-4">
          {SECONDARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              compact
              active={pathname === item.href}
              onNavigate={close}
            />
          ))}
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-white/5 bg-stone-950/80 px-3 backdrop-blur-md sm:px-4 lg:left-64 lg:border-b-0 lg:px-6 lg:pr-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:gap-8">
          <button
            type="button"
            className="shrink-0 p-2 text-stone-300 lg:hidden"
            aria-expanded={open}
            aria-controls="sector7-sidebar"
            onClick={() => setOpen(true)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-headline truncate text-sm font-black tracking-widest text-white sm:text-base lg:text-xl">
              <span className="lg:hidden">{sectionTitle}</span>
              <span className="hidden lg:inline">
                NUCLEAR COMMAND & CONTROL
              </span>
            </h1>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500 lg:hidden">
              Sector-7
            </p>
          </div>
          <nav
            className="-mx-1 hidden min-w-0 flex-1 overflow-x-auto px-1 lg:mx-0 lg:flex lg:overflow-visible"
            aria-label="Site zones"
          >
            <SiteZoneControls
              variant="header"
              className="gap-3 lg:gap-4"
              zones={SITE_ZONES_NO_ALL}
            />
          </nav>
        </div>
        <div className="relative flex shrink-0 items-center gap-2 sm:gap-4">
          <HeaderTelemetryStatus />
          <HeaderActions />
        </div>
      </header>

      <main className="ml-0 min-h-dvh overflow-x-hidden bg-surface-dim px-4 pb-24 pt-14 sm:px-5 sm:pb-28 lg:ml-64 lg:px-6 lg:pb-24">
        <div
          className="-mx-4 mb-4 flex flex-col gap-2 overflow-x-auto border-b border-outline-variant/20 px-4 pb-3 sm:-mx-5 sm:px-5 lg:hidden"
          aria-label="Site zones (mobile)"
        >
          <span className="font-label text-[9px] uppercase tracking-widest text-stone-500">
            Zone focus
          </span>
          <SiteZoneControls variant="mobile" />
        </div>
        <LiveGlobalStrip />
        {children}
      </main>

      <SiteZoneFooter />
      <BlueprintBackdrop />
      <PlantShutdownOverlay />
    </>
  );
}

export function Sector7Shell({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryProvider>
      <OperatorPreferencesProvider>
        <Sector7ShellInner>{children}</Sector7ShellInner>
      </OperatorPreferencesProvider>
    </TelemetryProvider>
  );
}
