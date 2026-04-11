import { SettingsPageLive } from "@/components/sector7/live/SettingsPageLive";
import { SettingsPanels } from "@/components/sector7/SettingsPanels";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | SECTOR-7",
};

export default function SettingsPage() {
  return (
    <SectionPage kicker="Console" title="Operator preferences & alerts">
      <SettingsPageLive />
      <SettingsPanels />
    </SectionPage>
  );
}
