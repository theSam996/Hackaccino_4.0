import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | SECTOR-7",
};

export default function SettingsPage() {
  return (
    <SectionPage kicker="Console" title="Operator preferences & alerts">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Display">
          <div className="space-y-4 font-mono text-[10px]">
            <label className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">High-contrast mode</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-secondary"
                defaultChecked
              />
            </label>
            <label className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-3">
              <span className="text-on-surface-variant">
                Reduce motion (UI)
              </span>
              <input type="checkbox" className="h-4 w-4 accent-secondary" />
            </label>
            <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-on-surface-variant">Telemetry density</span>
              <select className="w-full border border-outline-variant/30 bg-surface-container-high px-2 py-2 text-white sm:max-w-48">
                <option>Compact</option>
                <option>Comfortable</option>
                <option>Diagnostic</option>
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Alert routing">
          <ul className="space-y-3 font-mono text-[10px] text-on-surface-variant">
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Critical — page duty officer</span>
              <span className="text-secondary">ON</span>
            </li>
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Warning — console only</span>
              <span className="text-secondary">ON</span>
            </li>
            <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>External email</span>
              <span className="text-primary-fixed">DISABLED</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Session">
        <p className="font-mono text-[10px] text-on-surface-variant">
          Role: <span className="text-white">Senior operator</span> · Station:{" "}
          <span className="text-white">S7-A1</span> · Idle lock:{" "}
          <span className="text-secondary">12 min</span>
        </p>
      </Panel>
    </SectionPage>
  );
}
