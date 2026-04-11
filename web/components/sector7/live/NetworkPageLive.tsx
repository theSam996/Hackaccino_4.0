"use client";

import { Panel } from "@/components/sector7/SectionPage";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export function NetworkPageLive() {
  const { frame } = useTelemetryStream();
  const matrix = frame?.matrix ?? [];
  const netCells = matrix.filter((c) => c.label.startsWith("NET_"));
  const attack = frame?.mode === "attack" || frame?.is_anomaly;

  const nodes = [
    {
      name: "GATEWAY_01",
      zone: "Silo A1",
      state: attack ? "DEGRADED" : "ONLINE",
      rtt: frame
        ? `${(1.0 + (netCells[0]?.raw ?? 0) * 0.08).toFixed(1)} ms`
        : "—",
    },
    {
      name: "GATEWAY_02",
      zone: "Grid B",
      state: frame?.is_anomaly ? "DEGRADED" : "ONLINE",
      rtt: frame
        ? `${(2.5 + (netCells[1]?.raw ?? 0) * 0.12).toFixed(1)} ms`
        : "—",
    },
    {
      name: "FIREWALL-N",
      zone: "DMZ",
      state: "ONLINE",
      rtt: frame ? `${(0.3 + frame.anomaly_score * 2).toFixed(1)} ms` : "—",
    },
    {
      name: "MESH-EAST",
      zone: "External",
      state: frame?.mode === "attack" ? "DEGRADED" : "ONLINE",
      rtt: frame
        ? `${(12 + (netCells[3]?.raw ?? 0) * 0.35).toFixed(0)} ms`
        : "—",
    },
  ];

  return (
    <>
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
                    className={`mt-1 font-mono text-xs ${
                      i === 2
                        ? attack
                          ? "text-error"
                          : "text-primary-fixed"
                        : attack
                          ? "text-primary-fixed"
                          : "text-secondary"
                    }`}
                  >
                    {i === 2
                      ? attack
                        ? "HOT — REVIEW"
                        : "ARMED — MANUAL"
                      : attack
                        ? "CONGESTED"
                        : "FORWARDING"}
                  </div>
                </div>
              ),
            )}
          </div>
        </Panel>
        <Panel title="Mesh load (from NET_*)">
          <ul className="space-y-2 font-mono text-[10px] text-on-surface-variant">
            {netCells.length ? (
              netCells.map((c) => (
                <li key={c.label} className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <span className={c.ok ? "text-secondary" : "text-error"}>
                    {c.value}
                  </span>
                </li>
              ))
            ) : (
              <li>Awaiting matrix…</li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title="Node registry (live-derived)">
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
    </>
  );
}
