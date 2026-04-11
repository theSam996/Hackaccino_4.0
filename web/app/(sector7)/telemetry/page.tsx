import { TelemetryPageLive } from "@/components/sector7/live/TelemetryPageLive";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telemetry | SECTOR-7",
};

export default function TelemetryPage() {
  return (
    <SectionPage
      kicker="Live acquisition"
      title="Telemetry streams & ingest health"
    >
      <TelemetryPageLive />
    </SectionPage>
  );
}
