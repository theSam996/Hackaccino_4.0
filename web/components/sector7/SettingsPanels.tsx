"use client";

import { Panel } from "@/components/sector7/SectionPage";
import {
  useOperatorPreferences,
  type TelemetryDensity,
} from "@/contexts/OperatorPreferencesContext";

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-outline-variant/10 pb-3">
      <span className="text-on-surface-variant">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-secondary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsPanels() {
  const {
    prefs,
    setHighContrast,
    setReduceMotion,
    setTelemetryDensity,
    setAlertCriticalDuty,
    setAlertWarningConsole,
    setAlertExternalEmail,
    resetPreferences,
  } = useOperatorPreferences();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Display">
          <div className="space-y-4 font-mono text-[10px]">
            <ToggleRow
              label="High-contrast mode"
              checked={prefs.highContrast}
              onChange={setHighContrast}
            />
            <ToggleRow
              label="Reduce motion (UI)"
              checked={prefs.reduceMotion}
              onChange={setReduceMotion}
            />
            <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-on-surface-variant">Telemetry density</span>
              <select
                className="w-full border border-outline-variant/30 bg-surface-container-high px-2 py-2 text-white sm:max-w-48"
                value={prefs.telemetryDensity}
                onChange={(e) =>
                  setTelemetryDensity(e.target.value as TelemetryDensity)
                }
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="diagnostic">Diagnostic</option>
              </select>
            </label>
            <p className="text-on-surface-variant/90">
              Preferences save to this browser (
              <span className="text-secondary">localStorage</span>) and apply
              immediately across SECTOR-7.
            </p>
          </div>
        </Panel>
        <Panel title="Alert routing">
          <ul className="space-y-3 font-mono text-[10px] text-on-surface-variant">
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Critical — page duty officer</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <span className={prefs.alertCriticalDuty ? "text-secondary" : "text-primary-fixed"}>
                  {prefs.alertCriticalDuty ? "ON" : "OFF"}
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-secondary"
                  checked={prefs.alertCriticalDuty}
                  onChange={(e) => setAlertCriticalDuty(e.target.checked)}
                />
              </label>
            </li>
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Warning — console only</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <span
                  className={
                    prefs.alertWarningConsole ? "text-secondary" : "text-primary-fixed"
                  }
                >
                  {prefs.alertWarningConsole ? "ON" : "OFF"}
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-secondary"
                  checked={prefs.alertWarningConsole}
                  onChange={(e) => setAlertWarningConsole(e.target.checked)}
                />
              </label>
            </li>
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>External email</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <span
                  className={
                    prefs.alertExternalEmail ? "text-secondary" : "text-primary-fixed"
                  }
                >
                  {prefs.alertExternalEmail ? "ENABLED" : "DISABLED"}
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-secondary"
                  checked={prefs.alertExternalEmail}
                  onChange={(e) => setAlertExternalEmail(e.target.checked)}
                />
              </label>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Session">
        <p className="mb-3 font-mono text-[10px] text-on-surface-variant">
          Role: <span className="text-white">Senior operator</span> · Station:{" "}
          <span className="text-white">S7-A1</span> · Active zone:{" "}
          <span className="text-secondary">{prefs.zone}</span>
        </p>
        <button
          type="button"
          onClick={() => resetPreferences()}
          className="border border-outline-variant/40 px-3 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:border-secondary/50 hover:text-secondary"
        >
          Reset preferences to defaults
        </button>
      </Panel>
    </>
  );
}
