import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sensors | SECTOR-7",
};

const feeds = [
  { id: "CCTV-04", zone: "Perimeter NE", fps: "30", enc: "AES-256-GCM" },
  { id: "CCTV-11", zone: "Coolant hall", fps: "24", enc: "AES-256-GCM" },
  { id: "BIO-02", zone: "Access vault", fps: "—", enc: "HSM-backed" },
  { id: "LSR-09", zone: "Grid array", fps: "120", enc: "OFF (local)" },
];

export default function SensorsPage() {
  return (
    <SectionPage
      kicker="Optical & biometric"
      title="Sensor feeds & calibration"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {feeds.map((f) => (
          <Panel key={f.id} title={f.id}>
            <div className="aspect-video w-full bg-black/50">
              <div className="flex h-full items-center justify-center font-mono text-[9px] text-on-surface-variant">
                NO SIGNAL / SIMULATED
              </div>
            </div>
            <dl className="mt-3 space-y-1 font-mono text-[9px] text-on-surface-variant">
              <div className="flex justify-between">
                <dt>Zone</dt>
                <dd className="text-white">{f.zone}</dd>
              </div>
              <div className="flex justify-between">
                <dt>FPS</dt>
                <dd className="text-secondary">{f.fps}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Enc</dt>
                <dd className="text-white">{f.enc}</dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>

      <Panel
        title="Calibration queue"
        action={
          <span className="material-symbols-outlined text-xs text-secondary">
            tune
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-2 font-mono text-[10px] sm:grid-cols-2">
          <div className="border-l-2 border-secondary bg-surface-container-high p-3">
            THRM-1 — scheduled 22:00
          </div>
          <div className="border-l-2 border-primary-fixed bg-surface-container-high p-3">
            LSR-09 — blocked (offline)
          </div>
        </div>
      </Panel>
    </SectionPage>
  );
}
