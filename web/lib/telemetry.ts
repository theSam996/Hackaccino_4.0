export type MatrixCell = {
  label: string;
  value: string;
  ok: boolean;
  raw: number;
};

export type ScadaLine = {
  t: string;
  line: string;
  tone: "default" | "secondary" | "error" | "warning";
};

export type TelemetryFrame = {
  timestamp: string;
  mode: "normal" | "attack" | "shutdown";
  it_rpm: number;
  physical_rpm: number;
  it_temp_c: number;
  physical_temp_c: number;
  it_pressure_bar: number;
  physical_pressure_bar: number;
  it_vibration_mms: number;
  physical_vibration_mms: number;
  anomaly_score: number;
  is_anomaly: boolean;
  confidence: number;
  raw_score: number;
  divergences: {
    div_rpm: number;
    div_temp: number;
    div_pressure: number;
    div_vibration: number;
  };
  divergence_pct: {
    div_rpm: number;
    div_temp: number;
    div_pressure: number;
    div_vibration: number;
  };
  matrix: MatrixCell[];
  chart: {
    i: number;
    t: string;
    it_rpm: number;
    physical_rpm: number;
    it_temp: number;
    physical_temp: number;
    it_pressure: number;
    physical_pressure: number;
    it_vibration: number;
    physical_vibration: number;
  }[];
  scada: ScadaLine[];
  bars: { motion: number[]; thermal: number[]; vibration: number[] };
  alert: boolean;
  model_fallback?: boolean;
  plant_shutdown?: boolean;
};

export function telemetryStreamUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/telemetry/stream`;
}

export function telemetryApiPath(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `/api/telemetry/${p}`;
}
