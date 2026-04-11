"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    // Connect to the backend Server-Sent Events (SSE) stream
    const eventSource = new EventSource("http://localhost:8000/stream");

    eventSource.onopen = () => {
      setConnectionStatus("Connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setTelemetry(parsed);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      setConnectionStatus("Disconnected - Retrying...");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleInjectAttack = async () => {
    try {
      await fetch("http://localhost:8000/inject-payload", { method: "POST" });
    } catch (e) {
      console.error("Failed to inject attack", e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch("http://localhost:8000/reset", { method: "POST" });
    } catch (e) {
      console.error("Failed to reset", e);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-green-400 p-4 md:p-8 font-mono flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <header className="mb-6 border-b border-green-500/30 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-green-500 shadow-green-500 drop-shadow-md">
            CYBER-PHYSICAL MONITOR
          </h1>
          <div className="flex justify-between text-xs md:text-sm text-gray-400">
            <span>STATUS: <span className={connectionStatus === "Connected" ? "text-green-400" : "text-red-500"}>{connectionStatus}</span></span>
            <span>SYSTEM: ONLINE</span>
          </div>
        </header>

        {/* Action Controls */}
        <section className="mb-6 grid grid-cols-2 gap-4">
          <button 
            onClick={handleInjectAttack}
            className="bg-red-900/40 hover:bg-red-800/60 text-red-400 border border-red-700 py-3 rounded uppercase font-bold tracking-wider transition-colors active:scale-95"
          >
            Inject Attack
          </button>
          <button 
            onClick={handleReset}
            className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-700 py-3 rounded uppercase font-bold tracking-wider transition-colors active:scale-95"
          >
            Reset System
          </button>
        </section>

        {/* Dashboard Data */}
        {!telemetry ? (
          <div className="text-center py-20 animate-pulse text-green-500/50">
            AWAITING TELEMETRY DATA...
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Alert Banner */}
            {telemetry.is_anomaly && (
              <div className="bg-red-600 text-white font-bold p-4 rounded text-center uppercase animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400">
                ⚠️ ANOMALY DETECTED ⚠️
                <div className="text-xs font-normal mt-1 opacity-90">
                  Confidence: {(telemetry.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )}

            {/* Sensor Readings */}
            <div className="grid grid-cols-2 gap-3">
              <DataCard title="IT RPM" value={telemetry.it_rpm} unit="rpm" anomalous={telemetry.is_anomaly} />
              <DataCard title="PHYSICAL RPM" value={telemetry.physical_rpm} unit="rpm" anomalous={telemetry.is_anomaly} />
              
              <DataCard title="IT TEMP" value={telemetry.it_temp_c} unit="°C" anomalous={telemetry.is_anomaly} />
              <DataCard title="PHYSICAL TEMP" value={telemetry.physical_temp_c} unit="°C" anomalous={telemetry.is_anomaly} />
              
              <DataCard title="IT PRESSURE" value={Number(telemetry.it_pressure_bar).toFixed(2)} unit="bar" anomalous={telemetry.is_anomaly} />
              <DataCard title="PHYSICAL PRESSURE" value={Number(telemetry.physical_pressure_bar).toFixed(2)} unit="bar" anomalous={telemetry.is_anomaly} />
            </div>

            {/* Divergence Metrics */}
            <div className="mt-6 bg-gray-900 border border-gray-700 rounded p-4">
              <h2 className="text-gray-500 uppercase text-xs mb-3 font-bold border-b border-gray-800 pb-2">Divergence Analysis</h2>
              <div className="space-y-2 text-sm">
                <DivergenceRow label="RPM Diff" val={telemetry.divergences?.div_rpm} />
                <DivergenceRow label="Temp Diff" val={telemetry.divergences?.div_temp} />
                <DivergenceRow label="Pressure Diff" val={Number(telemetry.divergences?.div_pressure).toFixed(2)} />
                <DivergenceRow label="Vibration Diff" val={Number(telemetry.divergences?.div_vibration).toFixed(3)} />
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

// Sub-components
function DataCard({ title, value, unit, anomalous }: { title: string, value: any, unit: string, anomalous: boolean }) {
  return (
    <div className={`p-3 rounded border ${anomalous && title.includes("PHYSICAL") ? 'border-red-500/50 bg-red-950/20' : 'border-green-500/20 bg-green-950/10'}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{title}</div>
      <div className={`text-xl font-bold ${anomalous && title.includes("PHYSICAL") ? 'text-red-400' : 'text-green-400'}`}>
        {value} <span className="text-xs font-normal opacity-50">{unit}</span>
      </div>
    </div>
  );
}

function DivergenceRow({ label, val }: { label: string, val: any }) {
  const numVal = Number(val);
  const isHigh = Math.abs(numVal) > (label.includes('RPM') ? 500 : label.includes('Temp') ? 50 : 10);
  return (
    <div className="flex flex-row justify-between items-center w-full">
      <span className="text-gray-400 font-normal">{label}:</span>
      <span className={`font-bold ${isHigh ? 'text-red-400 font-bold' : 'text-green-500'}`}>
        {isHigh ? '▲ ' : ''}{val}
      </span>
    </div>
  );
}
