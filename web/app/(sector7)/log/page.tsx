import { ScadaLogView } from "@/components/sector7/ScadaLogView";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log | SECTOR-7",
};

export default function LogPage() {
  return (
    <SectionPage kicker="SCADA" title="Facility log feed">
      <ScadaLogView />
    </SectionPage>
  );
}
