import { EventsPageLive } from "@/components/sector7/live/EventsPageLive";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events | SECTOR-7",
};

export default function EventsPage() {
  return (
    <SectionPage kicker="Audit trail" title="Security & plant events">
      <EventsPageLive />
    </SectionPage>
  );
}
