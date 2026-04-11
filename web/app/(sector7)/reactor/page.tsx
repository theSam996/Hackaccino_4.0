import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reactor | SECTOR-7",
};

export default function ReactorPage() {
  return (
    <SectionPage
      kicker="Core plant"
      title="Reactor state & safety interlocks"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Thermal hydraulic snapshot">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Core outlet", "321 °C"],
              ["Pressurizer", "15.4 MPa"],
              ["Steam gen ΔT", "28 °C"],
              ["Flow A", "4120 t/h"],
              ["Flow B", "4088 t/h"],
              ["Containment", "0.12 kPa Δ"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="border border-outline-variant/15 bg-surface-container-high p-3"
              >
                <div className="font-label text-[8px] uppercase tracking-wider text-on-surface-variant">
                  {k}
                </div>
                <div className="font-mono text-sm text-white">{v}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Interlocks"
          action={
            <span className="material-symbols-outlined text-xs text-error">
              lock
            </span>
          }
        >
          <ul className="space-y-2 font-mono text-[10px]">
            <li className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">SCRAM-A</span>
              <span className="text-secondary">READY</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">ATWS</span>
              <span className="text-secondary">ARMED</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">Containment iso.</span>
              <span className="text-white">STANDBY</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Rod group demand vs actual">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 items-end gap-1">
            {[35, 38, 40, 42, 41, 39, 37, 36, 38, 40].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary-fixed/40"
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
          <div className="font-mono text-[10px] text-on-surface-variant sm:w-48">
            Demand trace: nominal
            <br />
            Actual trace: <span className="text-secondary">tracking</span>
          </div>
        </div>
      </Panel>
    </SectionPage>
  );
}
