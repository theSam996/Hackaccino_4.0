import { CommandDashboardGate } from "@/components/sector7/CommandDashboardGate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command | SECTOR-7",
};

export default function CommandPage() {
  return <CommandDashboardGate />;
}
