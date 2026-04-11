import { NetworkPageLive } from "@/components/sector7/live/NetworkPageLive";
import { SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network | SECTOR-7",
};

export default function NetworkPage() {
  return (
    <SectionPage
      kicker="Topology"
      title="IT / OT boundary & mesh status"
    >
      <NetworkPageLive />
    </SectionPage>
  );
}
