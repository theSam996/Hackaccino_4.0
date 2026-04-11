"use client";

import dynamic from "next/dynamic";

const CommandDashboard = dynamic(
  () => import("@/components/sector7/CommandDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center font-mono text-sm text-on-surface-variant lg:text-base">
        Loading command console…
      </div>
    ),
  },
);

export function CommandDashboardGate() {
  return <CommandDashboard />;
}
