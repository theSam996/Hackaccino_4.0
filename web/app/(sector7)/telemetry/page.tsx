import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telemetry | SECTOR-7",
};

const streams = [
  { id: "OT-BUS-A", rate: "4.2k pkt/s", health: "NOMINAL", lag: "2ms" },
  { id: "HMI-BRIDGE", rate: "890 pkt/s", health: "NOMINAL", lag: "6ms" },
  { id: "HISTORIAN-S7", rate: "120 evt/s", health: "DEGRADED", lag: "38ms" },
  { id: "EXT-MESH", rate: "2.1k pkt/s", health: "NOMINAL", lag: "11ms" },
];

export default function TelemetryPage() {
  return (
    <SectionPage
      kicker="Live acquisition"
      title="Telemetry streams & ingest health"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Sample rate budget">
          <div className="space-y-3 font-mono text-[10px] text-on-surface-variant">
            <div className="flex justify-between border-b border-outline-variant/10 pb-2">
              <span>Allocated</span>
              <span className="text-secondary">10.0 kHz</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-2">
              <span>Consumed</span>
              <span className="text-white">9.62 kHz</span>
            </div>
            <div className="flex justify-between">
              <span>Headroom</span>
              <span className="text-primary-fixed">3.8%</span>
            </div>
          </div>
        </Panel>
        <Panel title="Buffer depth">
          <div className="flex h-28 items-end gap-1 sm:h-32">
            {[40, 55, 48, 62, 50, 70, 45, 58, 52, 65].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-secondary/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[9px] text-on-surface-variant">
            Rolling 60s — no overruns in last window
          </p>
        </Panel>
        <Panel title="Clock sync" className="md:col-span-2 xl:col-span-1">
          <p className="font-mono text-[10px] leading-relaxed text-on-surface-variant">
            PTP grandmaster: <span className="text-secondary">GM-ALPHA-1</span>
            <br />
            Offset: <span className="text-white">+120 ns</span> (within envelope)
            <br />
            Holdover: <span className="text-white">disabled</span>
          </p>
        </Panel>
      </div>

      <Panel
        title="Stream matrix"
        action={
          <span className="material-symbols-outlined text-xs text-secondary">
            table_chart
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-mono text-[10px]">
            <thead className="border-b border-outline-variant/15 uppercase text-on-surface-variant">
              <tr>
                <th className="py-2 pr-4">Stream</th>
                <th className="py-2 pr-4">Rate</th>
                <th className="py-2 pr-4">Health</th>
                <th className="py-2">Lag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {streams.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 text-white">{row.id}</td>
                  <td className="py-2 pr-4">{row.rate}</td>
                  <td
                    className={`py-2 pr-4 ${row.health === "DEGRADED" ? "text-primary-fixed" : "text-secondary"}`}
                  >
                    {row.health}
                  </td>
                  <td className="py-2">{row.lag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </SectionPage>
  );
}
