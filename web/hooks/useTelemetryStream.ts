"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TelemetryFrame } from "@/lib/telemetry";
import { telemetryApiPath, telemetryStreamUrl } from "@/lib/telemetry";

export function useTelemetryStream() {
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

  return { frame, connected, error, inject, reset };
}
