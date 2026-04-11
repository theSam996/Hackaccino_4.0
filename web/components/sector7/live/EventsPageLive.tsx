"use client";

import { Panel } from "@/components/sector7/SectionPage";
import { LiveWallClock } from "@/components/sector7/LiveWallClock";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

function toneToSev(tone: string) {
  if (tone === "error") return "CRIT";
  if (tone === "warning") return "WARN";
  if (tone === "secondary") return "INFO";
  return "INFO";
}

export function EventsPageLive() {
  const { frame } = useTelemetryStream();
  const rows = frame?.scada?.length
    ? frame.scada.slice(0, 24).map((row, i) => ({
        key: `${row.t}-${i}-${row.line.slice(0, 32)}`,
        ts: row.t,
        sev: toneToSev(row.tone),
        src: "SCADA",
        msg: row.line,
        tone: row.tone,
      }))
    : [];

  return (
    <>
      <Panel
        title="Live feed"
        action={
          <span className="flex items-center gap-2 font-mono text-[10px] text-secondary">
            Clock <LiveWallClock />
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
                <tr key={r.key}>
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
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="py-6 text-on-surface-variant">
                    No SCADA lines yet — open the Log page or wait for the stream.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Export policy">
          <p className="font-mono text-[10px] leading-relaxed text-on-surface-variant">
            Same SSE buffer as Command. Last telemetry:{" "}
            <span className="text-white">
              {frame?.timestamp ?? "—"}
            </span>
          </p>
        </Panel>
        <Panel title="Acknowledgements">
          <p className="font-mono text-[10px] text-secondary">
            {frame?.is_anomaly
              ? `${(frame.anomaly_score * 100).toFixed(0)}% anomaly — review Command console`
              : "0 unacknowledged critical events in your operator scope."}
          </p>
        </Panel>
      </div>
    </>
  );
}
