import {
  ReactorRodLive,
  ReactorThermalLive,
  ReactorTopologyLive,
} from "@/components/sector7/live/ReactorPageLive";
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
        <Panel title="Thermal hydraulic snapshot (live)">
          <ReactorThermalLive />
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

      <Panel title="Facility topology (live)">
        <ReactorTopologyLive />
      </Panel>

      <Panel title="Rod group demand vs actual (live bars)">
        <ReactorRodLive />
      </Panel>
    </SectionPage>
  );
}
