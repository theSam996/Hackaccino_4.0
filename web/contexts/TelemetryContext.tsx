"use client";

import type { TelemetryFrame } from "@/lib/telemetry";
import { telemetryApiPath, telemetryStreamUrl } from "@/lib/telemetry";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type TelemetryContextValue = {
  frame: TelemetryFrame | null;
  connected: boolean;
  error: string | null;
  inject: () => Promise<void>;
  reset: () => Promise<void>;
};

export const TelemetryContext = createContext<TelemetryContextValue | null>(
  null,
);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState<TelemetryFrame | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = telemetryStreamUrl();
    if (!url) return;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as TelemetryFrame;
        setFrame(data);
      } catch {
        setError("Invalid telemetry payload");
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError("Stream disconnected — is the backend running on :8000?");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  const inject = useCallback(async () => {
    await fetch(telemetryApiPath("inject-payload"), { method: "POST" });
  }, []);

  const reset = useCallback(async () => {
    await fetch(telemetryApiPath("reset"), { method: "POST" });
  }, []);

  const value = useMemo(
    () => ({ frame, connected, error, inject, reset }),
    [frame, connected, error, inject, reset],
  );

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}
