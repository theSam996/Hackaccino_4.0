import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Operator Guide | SECTOR-7",
};

function Prose({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`space-y-3 font-mono text-[11px] leading-relaxed text-on-surface-variant sm:text-sm ${className}`}
    >
      {children}
    </div>
  );
}

function DataTable({
  head,
  rows,
}: {
  head: [string, string, string];
  rows: [string, string, string][];
}) {
  return (
    <div className="overflow-x-auto border border-outline-variant/20">
      <table className="w-full min-w-[280px] text-left text-[10px] sm:text-[11px]">
        <thead className="border-b border-outline-variant/20 bg-surface-container-high uppercase tracking-wider text-on-surface-variant">
          <tr>
            <th className="px-2 py-2 sm:px-3">{head[0]}</th>
            <th className="px-2 py-2 sm:px-3">{head[1]}</th>
            <th className="px-2 py-2 sm:px-3">{head[2]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/15 text-on-background">
          {rows.map((r) => (
            <tr key={r[0] + r[1]}>
              <td className="px-2 py-2 font-medium text-white sm:px-3">{r[0]}</td>
              <td className="px-2 py-2 sm:px-3">{r[1]}</td>
              <td className="px-2 py-2 text-secondary sm:px-3">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuidePage() {
  return (
    <SectionPage
      kicker="Operator documentation"
      title="Nuclear Facility Alpha — Operator Guide"
    >
      <p className="font-label text-xs uppercase tracking-widest text-secondary">
        Cyber-Physical Anomaly Detection System
      </p>
      <p className="font-mono text-[10px] text-on-surface-variant sm:text-xs">
        Version: 1.0 · Audience: Facility Safety Officers &amp; Plant Operators
      </p>

      <Panel title="What this system does">
        <Prose>
          <p>
            This dashboard monitors your nuclear facility in real time. It watches{" "}
            <strong className="text-white">two separate data streams</strong>{" "}
            simultaneously:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-1 text-on-surface-variant marker:text-secondary">
            <li>
              <span className="text-white">Physical sensors</span> — what is
              actually happening inside the facility (pump speed, temperature,
              pressure, vibration, etc.)
            </li>
            <li>
              <span className="text-white">IT network feed</span> — what the
              facility&apos;s computer systems are reporting
            </li>
          </ul>
          <p>
            If a cyber attack occurs, attackers can spoof the IT feed to show
            &quot;Normal&quot; while physically pushing hardware toward failure.
            This system detects that gap and{" "}
            <strong className="text-secondary">alerts you immediately</strong>{" "}
            — before damage occurs.
          </p>
        </Prose>
      </Panel>

      <Panel title="Getting started">
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-secondary">
              Step 1 — Open the dashboard
            </h3>
            <Prose>
              <p>
                Open your browser and go to the facility dashboard URL provided by
                your IT team. The system works on any modern browser — Chrome,
                Firefox, or Edge. You will see the secure application shell.
              </p>
            </Prose>
          </div>
          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-secondary">
              Step 2 — Log in
            </h3>
            <Prose>
              <p>
                Enter your operator ID and secure PIN as issued by your plant
                manager. Do not share your credentials with anyone. Once
                authenticated, the dashboard loads and begins receiving live data
                within a few seconds.
              </p>
            </Prose>
          </div>
          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-secondary">
              Step 3 — Check the connection indicator
            </h3>
            <Prose>
              <p>
                In the header and live strip, look for the{" "}
                <span className="text-secondary">SSE / telemetry live</span>{" "}
                indicator with a green pulsing dot. This confirms the system is
                receiving real-time telemetry from the facility.
              </p>
              <p className="text-error/90">
                If this indicator is not green, contact your IT administrator
                immediately.
              </p>
            </Prose>
          </div>
        </div>
      </Panel>

      <Panel title="Reading the dashboard">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              System status (header &amp; live strip)
            </h3>
            <Prose className="mb-3">
              <p>
                Telemetry and model state are summarized in the header badge and
                the live strip below it. Use them together with the Command
                console.
              </p>
            </Prose>
            <DataTable
              head={["State", "Meaning", "Your action"]}
              rows={[
                [
                  "Green / nominal",
                  "Stream live, scores within envelope",
                  "Continue monitoring",
                ],
                [
                  "Amber / elevated",
                  "Attack mode or elevated anomaly score",
                  "Watch closely; review IT vs physical charts",
                ],
                [
                  "Red / breach",
                  "High divergence or model threshold",
                  "Follow incident response below",
                ],
              ]}
            />
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              Threat level &amp; anomaly score
            </h3>
            <Prose>
              <p>
                The Command dashboard shows an{" "}
                <strong className="text-white">anomaly score</strong> derived from
                the Isolation Forest model (and fallbacks). Under normal
                conditions this stays low. If it climbs toward the configured
                threshold, pay close attention and cross-check physical vs IT
                traces.
              </p>
            </Prose>
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              Physical telemetry (motion, thermal, vibration)
            </h3>
            <Prose className="mb-3">
              <p>
                Live bar stacks and numeric readouts reflect physical plant
                behaviour. Bars encode proximity to envelope — treat rapid change
                alongside IT divergence as high priority.
              </p>
            </Prose>
            <DataTable
              head={["Signal", "What it measures", "Example nominal band"]}
              rows={[
                ["Pump / RPM", "Cooling / shaft speed", "≈ 1,450 – 1,510 rev/min"],
                ["Reactor temp", "Core temperature", "≈ 308 – 316 °C"],
                ["Coolant PSI", "Loop pressure", "≈ 152 – 158 bar"],
                ["Turbine load", "Generation demand", "≈ 75 – 82 %"],
                ["Core vibration", "Mechanical vibration", "≈ 0.7 – 1.0 mm/s"],
                ["Valve / flow", "Control position / flow proxy", "Per plant SOP"],
              ]}
            />
            <p className="mt-3 font-mono text-[10px] text-on-surface-variant sm:text-[11px]">
              <span className="text-secondary">Green / calm bars</span> = safe
              envelope. <span className="text-primary-fixed">Amber</span> =
              warning. <span className="text-error">Red / flashing</span> =
              critical — act per procedure.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              IT network feed
            </h3>
            <Prose>
              <p>
                SCADA-style lines and the IT vs physical charts show what digital
                systems report. During spoofing, IT traces may remain
                &quot;nominal&quot; while physical traces diverge — that pattern is
                what this platform highlights.
              </p>
            </Prose>
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              Live charts (IT vs physical)
            </h3>
            <Prose>
              <p>
                <strong className="text-white">Physical</strong> lines track OT
                signals; <strong className="text-white">IT (spoofed)</strong>{" "}
                lines track the HMI / historian path. In healthy operation they
                track together. If the physical trace spikes while IT stays flat,
                treat that as a spoofing signature and escalate.
              </p>
              <p>
                The per-metric panels also show{" "}
                <strong className="text-white">Δ (phys − IT)</strong> so
                separation is visible even when both traces look close on the
                primary scale.
              </p>
            </Prose>
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              Divergence matrix &amp; reactor topology
            </h3>
            <Prose>
              <p>
                The matrix summarizes channel deltas and mesh weights. The
                reactor topology schematic animates flow paths; breach styling on
                the IT edge indicates when payload or model state matches attack
                signatures.
              </p>
            </Prose>
          </div>

          <div>
            <h3 className="mb-2 font-label text-[10px] uppercase tracking-widest text-white">
              Event timeline &amp; logs
            </h3>
            <Prose>
              <p>
                The Command chronology and the dedicated{" "}
                <strong className="text-white">Log</strong> page capture SCADA and
                model events with timestamps. Use them as your contemporaneous
                evidence trail — export policy remains governed by your site
                records programme.
              </p>
            </Prose>
          </div>
        </div>
      </Panel>

      <Panel title="Incident response — when the alert fires">
        <Prose className="mb-4">
          <p>
            When the model flags an anomaly or attack mode is injected for
            exercise, treat the console as authoritative. The exact threshold is
            configured with your deployment; the UI shows live score and mode.
          </p>
        </Prose>
        <ol className="list-decimal space-y-4 pl-5 font-mono text-[11px] text-on-surface-variant marker:text-secondary sm:text-sm">
          <li>
            <strong className="text-white">Verify</strong> — Compare IT vs
            physical charts and the topology / matrix. Confirm divergence is not
            explained by approved maintenance.
          </li>
          <li>
            <strong className="text-white">Contain</strong> — Execute your
            site&apos;s cyber-physical playbook (SCRAM, containment, alternate
            comms). This application does not replace licensed operator actions or
            safety systems.
          </li>
          <li>
            <strong className="text-white">Escalate</strong> — Notify Plant
            Manager, Facility Security, and regulators per protocol. Prefer
            out-of-band voice paths if IT integrity is uncertain.
          </li>
          <li>
            <strong className="text-white">Preserve evidence</strong> — Keep SSE
            sessions and log exports per legal hold instructions.
          </li>
        </ol>
      </Panel>

      <Panel title="False positives">
        <Prose>
          <p>
            Maintenance, sensor drift, or legitimate transients can elevate scores
            without malicious intent. If IT and physical traces move{" "}
            <em>together</em>, suspect instrumentation before cyber. When in
            doubt, escalate — it is safer to over-report than to dismiss a genuine
            attack.
          </p>
        </Prose>
      </Panel>

      <Panel title="End of shift — handoff">
        <ul className="list-disc space-y-2 pl-5 font-mono text-[11px] text-on-surface-variant marker:text-secondary sm:text-sm">
          <li>Review the event timeline and Log for anomalies during your watch.</li>
          <li>
            Confirm relief staff are connected (green telemetry) before you leave.
          </li>
          <li>
            Record handoff notes per your station log (paper or approved digital
            system).
          </li>
          <li>Use the secure Log Out control when finished.</li>
        </ul>
      </Panel>

      <p className="border-t border-outline-variant/20 pt-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
        End of operator guide · Nuclear Facility Alpha
      </p>
    </SectionPage>
  );
}
