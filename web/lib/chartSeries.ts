import type { TelemetryFrame } from "@/lib/telemetry";

export type ChartPoint = TelemetryFrame["chart"][number];

/** One metric pair + divergence for a single chart — uniform keys for Recharts. */
export type MetricSeriesRow = {
  t: string;
  it: number;
  phys: number;
  /** Physical − IT (same units as the signals). */
  delta: number;
};

function rowFromChart(
  r: ChartPoint,
  itKey: keyof ChartPoint,
  physKey: keyof ChartPoint,
): MetricSeriesRow {
  const it = Number(r[itKey]);
  const phys = Number(r[physKey]);
  return {
    t: String(r.t),
    it,
    phys,
    delta: phys - it,
  };
}

export function rpmSeries(chart: ChartPoint[]): MetricSeriesRow[] {
  return chart.map((r) => rowFromChart(r, "it_rpm", "physical_rpm"));
}

export function tempSeries(chart: ChartPoint[]): MetricSeriesRow[] {
  return chart.map((r) => rowFromChart(r, "it_temp", "physical_temp"));
}

export function pressureSeries(chart: ChartPoint[]): MetricSeriesRow[] {
  return chart.map((r) => rowFromChart(r, "it_pressure", "physical_pressure"));
}

export function vibrationSeries(chart: ChartPoint[]): MetricSeriesRow[] {
  return chart.map((r) => rowFromChart(r, "it_vibration", "physical_vibration"));
}

/** Multi-point demo when SSE history is not ready — each metric has a distinct shape/scale. */
export function syntheticChartHistory(): ChartPoint[] {
  const n = 72;
  const out: ChartPoint[] = [];
  for (let i = 0; i < n; i++) {
    const w = i * 0.12;
    const itRpm = 1200 + Math.sin(w * 1.1) * 14 + Math.cos(w * 0.4) * 6;
    const physRpm = itRpm + Math.sin(w * 2.3) * 22 + (i > 40 ? (i - 40) * 8 : 0);
    const itTemp = 285 + Math.sin(w * 0.9) * 1.2;
    const physTemp = itTemp + Math.sin(w * 1.7) * 4 + (i > 45 ? (i - 45) * 0.35 : 0);
    const itPr = 72 + Math.sin(w * 1.4) * 0.6;
    const physPr = itPr + Math.cos(w * 2.1) * 1.8 + (i > 42 ? (i - 42) * 0.12 : 0);
    const itVib = 0.12 + Math.sin(w * 2.8) * 0.018;
    const physVib = itVib + Math.abs(Math.sin(w * 3.2)) * 0.04 + (i > 38 ? (i - 38) * 0.006 : 0);
    const sec = (i * 3) % 60;
    const min = Math.floor((i * 3) / 60) % 60;
    const t = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    out.push({
      i,
      t,
      it_rpm: itRpm,
      physical_rpm: physRpm,
      it_temp: itTemp,
      physical_temp: physTemp,
      it_pressure: itPr,
      physical_pressure: physPr,
      it_vibration: itVib,
      physical_vibration: physVib,
    });
  }
  return out;
}
