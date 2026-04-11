import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network | SECTOR-7",
};

const nodes = [
  { name: "GATEWAY_01", zone: "Silo A1", state: "ONLINE", rtt: "1.2 ms" },
  { name: "GATEWAY_02", zone: "Grid B", state: "ONLINE", rtt: "2.8 ms" },
  { name: "FIREWALL-N", zone: "DMZ", state: "ONLINE", rtt: "0.4 ms" },
  { name: "MESH-EAST", zone: "External", state: "DEGRADED", rtt: "44 ms" },
];

export default function NetworkPage() {
  return (
    <SectionPage
      kicker="Topology"
      title="IT / OT boundary & mesh status"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Path redundancy"
          className="lg:col-span-2"
          action={
            <span className="material-symbols-outlined text-xs text-secondary">
              account_tree
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {["Primary OT ring", "Secondary SCADA VLAN", "Emergency bypass"].map(
              (label, i) => (
                <div
                  key={label}
                  className="border border-outline-variant/20 bg-surface-container-high p-3"
                >
                  <div className="font-label text-[9px] uppercase tracking-wider text-on-surface-variant">
                    {label}
                  </div>
                  <div
                    className={`mt-1 font-mono text-xs ${i === 2 ? "text-primary-fixed" : "text-secondary"}`}
                  >
                    {i === 2 ? "ARMED — MANUAL" : "FORWARDING"}
                  </div>
                </div>
              ),
            )}
          </div>
        </Panel>
        <Panel title="Encryption posture">
          <ul className="space-y-2 font-mono text-[10px] text-on-surface-variant">
            <li>
              mTLS: <span className="text-white">enforced</span>
            </li>
            <li>
              Cipher suites: <span className="text-secondary">TLS 1.3</span>
            </li>
            <li>
              Key rotation: <span className="text-white">72h</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Node registry">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left font-mono text-[10px]">
            <thead className="border-b border-outline-variant/15 text-on-surface-variant uppercase">
              <tr>
                <th className="py-2 pr-4">Node</th>
                <th className="py-2 pr-4">Zone</th>
                <th className="py-2 pr-4">State</th>
                <th className="py-2">RTT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {nodes.map((n) => (
                <tr key={n.name}>
                  <td className="py-2 pr-4 text-white">{n.name}</td>
                  <td className="py-2 pr-4">{n.zone}</td>
                  <td
                    className={`py-2 pr-4 ${n.state === "DEGRADED" ? "text-primary-fixed" : "text-secondary"}`}
                  >
                    {n.state}
                  </td>
                  <td className="py-2">{n.rtt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </SectionPage>
  );
}
