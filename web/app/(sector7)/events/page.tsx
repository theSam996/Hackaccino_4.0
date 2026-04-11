import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | SECTOR-7",
};

const rows = [
  {
    ts: "14:03:02",
    sev: "CRIT",
    src: "NET_W4",
    msg: "Divergence spike — digital vs physical",
  },
  {
    ts: "14:02:55",
    sev: "WARN",
    src: "GATEWAY_02",
    msg: "Packet loss trending 1%",
  },
  {
    ts: "14:02:22",
    sev: "WARN",
    src: "SCADA",
    msg: "Sensor A14 drift +12.4%",
  },
  {
    ts: "14:00:01",
    sev: "INFO",
    src: "AUTH",
    msg: "Shift handover — key 729",
  },
];

export default function EventsPage() {
  return (
    <SectionPage kicker="Audit trail" title="Security & plant events">
      <Panel
        title="Live feed"
        action={
          <span className="material-symbols-outlined text-xs text-secondary">
            filter_list
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left font-mono text-[10px]">
            <thead className="border-b border-outline-variant/15 uppercase text-on-surface-variant">
              <tr>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Sev</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {rows.map((r) => (
                <tr key={r.ts + r.msg}>
                  <td className="py-2 pr-3 text-on-surface-variant">{r.ts}</td>
                  <td
                    className={`py-2 pr-3 ${
                      r.sev === "CRIT"
                        ? "text-error"
                        : r.sev === "WARN"
                          ? "text-primary-fixed"
                          : "text-secondary"
                    }`}
                  >
                    {r.sev}
                  </td>
                  <td className="py-2 pr-3 text-white">{r.src}</td>
                  <td className="py-2 text-on-background">{r.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Export policy">
          <p className="font-mono text-[10px] leading-relaxed text-on-surface-variant">
            Immutable log shipping to cold vault every 15 minutes. Local
            retention: 30 days rolling.
          </p>
        </Panel>
        <Panel title="Acknowledgements">
          <p className="font-mono text-[10px] text-secondary">
            0 unacknowledged critical events in your operator scope.
          </p>
        </Panel>
      </div>
    </SectionPage>
  );
}
