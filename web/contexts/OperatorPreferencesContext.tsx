"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SiteZoneId =
  | "all"
  | "silo-a1"
  | "silo-a2"
  | "grid-b"
  | "external";

export type TelemetryDensity = "compact" | "comfortable" | "diagnostic";

export type OperatorPreferences = {
  zone: SiteZoneId;
  highContrast: boolean;
  reduceMotion: boolean;
  telemetryDensity: TelemetryDensity;
  alertCriticalDuty: boolean;
  alertWarningConsole: boolean;
  alertExternalEmail: boolean;
};

const STORAGE_KEY = "sector7-operator-prefs-v1";

const DEFAULTS: OperatorPreferences = {
  zone: "all",
  highContrast: true,
  reduceMotion: false,
  telemetryDensity: "comfortable",
  alertCriticalDuty: true,
  alertWarningConsole: true,
  alertExternalEmail: false,
};

function loadPrefs(): OperatorPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<OperatorPreferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function savePrefs(p: OperatorPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function applyDocumentFlags(p: OperatorPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("s7-high-contrast", p.highContrast);
  root.classList.toggle("s7-reduce-motion", p.reduceMotion);
  root.dataset.telemetryDensity = p.telemetryDensity;
  root.dataset.siteZone = p.zone;
}

type Ctx = {
  prefs: OperatorPreferences;
  setZone: (z: SiteZoneId) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setTelemetryDensity: (d: TelemetryDensity) => void;
  setAlertCriticalDuty: (v: boolean) => void;
  setAlertWarningConsole: (v: boolean) => void;
  setAlertExternalEmail: (v: boolean) => void;
  resetPreferences: () => void;
};

const OperatorPreferencesContext = createContext<Ctx | null>(null);

export function OperatorPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<OperatorPreferences>(DEFAULTS);

  useEffect(() => {
    const next = loadPrefs();
    setPrefs(next);
    applyDocumentFlags(next);
  }, []);

  const commit = useCallback((updater: (prev: OperatorPreferences) => OperatorPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      savePrefs(next);
      applyDocumentFlags(next);
      return next;
    });
  }, []);

  const setZone = useCallback(
    (zone: SiteZoneId) => commit((prev) => ({ ...prev, zone })),
    [commit],
  );

  const setHighContrast = useCallback(
    (highContrast: boolean) => commit((prev) => ({ ...prev, highContrast })),
    [commit],
  );

  const setReduceMotion = useCallback(
    (reduceMotion: boolean) => commit((prev) => ({ ...prev, reduceMotion })),
    [commit],
  );

  const setTelemetryDensity = useCallback(
    (telemetryDensity: TelemetryDensity) =>
      commit((prev) => ({ ...prev, telemetryDensity })),
    [commit],
  );

  const setAlertCriticalDuty = useCallback(
    (alertCriticalDuty: boolean) =>
      commit((prev) => ({ ...prev, alertCriticalDuty })),
    [commit],
  );

  const setAlertWarningConsole = useCallback(
    (alertWarningConsole: boolean) =>
      commit((prev) => ({ ...prev, alertWarningConsole })),
    [commit],
  );

  const setAlertExternalEmail = useCallback(
    (alertExternalEmail: boolean) =>
      commit((prev) => ({ ...prev, alertExternalEmail })),
    [commit],
  );

  const resetPreferences = useCallback(() => {
    commit(() => DEFAULTS);
  }, [commit]);

  const value = useMemo(
    () => ({
      prefs,
      setZone,
      setHighContrast,
      setReduceMotion,
      setTelemetryDensity,
      setAlertCriticalDuty,
      setAlertWarningConsole,
      setAlertExternalEmail,
      resetPreferences,
    }),
    [
      prefs,
      setZone,
      setHighContrast,
      setReduceMotion,
      setTelemetryDensity,
      setAlertCriticalDuty,
      setAlertWarningConsole,
      setAlertExternalEmail,
      resetPreferences,
    ],
  );

  return (
    <OperatorPreferencesContext.Provider value={value}>
      {children}
    </OperatorPreferencesContext.Provider>
  );
}

export function useOperatorPreferences() {
  const ctx = useContext(OperatorPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useOperatorPreferences must be used within OperatorPreferencesProvider",
    );
  }
  return ctx;
}

/** Silo A1 → External (no “All”). Used for desktop header + fixed footer. */
export const SITE_ZONES_NO_ALL: { id: SiteZoneId; label: string }[] = [
  { id: "silo-a1", label: "Silo A1" },
  { id: "silo-a2", label: "Silo A2" },
  { id: "grid-b", label: "Grid B" },
  { id: "external", label: "External" },
];

export const SITE_ZONES: { id: SiteZoneId; label: string }[] = [
  ...SITE_ZONES_NO_ALL,
  { id: "all", label: "All" },
];

/** @deprecated Use SITE_ZONES_NO_ALL — same list. */
export const SITE_ZONES_FOOTER = SITE_ZONES_NO_ALL;
