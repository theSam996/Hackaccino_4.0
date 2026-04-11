import Link from "next/link";
import { Panel, SectionPage } from "@/components/sector7/SectionPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log Out | SECTOR-7",
};

export default function LogoutPage() {
  return (
    <SectionPage kicker="Session" title="Signed out (demo)">
      <Panel title="Status">
        <p className="mb-4 font-mono text-[10px] leading-relaxed text-on-surface-variant">
          This build does not persist authentication. Selecting{" "}
          <span className="text-white">Log Out</span> only routes here for UI
          parity.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-secondary/40 bg-secondary/10 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20"
        >
          <span className="material-symbols-outlined text-sm">login</span>
          Return to command
        </Link>
      </Panel>
    </SectionPage>
  );
}
