import { SensorsPageLive } from "@/components/sector7/live/SensorsPageLive";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sensors | SECTOR-7",
};

export default function SensorsPage() {
  return (
    <SectionPage
      kicker="Optical & biometric"
      title="Sensor feeds & calibration"
    >
      <SensorsPageLive />
    </SectionPage>
  );
}
