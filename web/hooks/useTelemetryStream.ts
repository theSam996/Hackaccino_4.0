"use client";

import { TelemetryContext } from "@/contexts/TelemetryContext";
import { useContext } from "react";

export function useTelemetryStream() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error(
      "useTelemetryStream must be used within TelemetryProvider (Sector7 shell)",
    );
  }
  return ctx;
}
