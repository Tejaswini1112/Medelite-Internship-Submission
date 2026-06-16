import type { FacilityReportData, ManualInputs, MetricLine } from '../types';

export const NOT_AVAILABLE = 'Data not available';

export function formatMetricValue(value: number | null, unit: 'percent' | 'rate'): string {
  if (value === null || Number.isNaN(value)) return NOT_AVAILABLE;
  return unit === 'percent' ? `${value.toFixed(1)}%` : value.toFixed(2);
}

export function variance(metric: MetricLine, benchmark: 'state' | 'national') {
  const base = benchmark === 'state' ? metric.stateAverage : metric.nationalAverage;
  if (metric.facility === null || base === null) {
    return { text: NOT_AVAILABLE, favorable: null as boolean | null };
  }
  const delta = metric.facility - base;
  const favorable = delta <= 0;
  const sign = delta > 0 ? '+' : '';
  const text = metric.unit === 'percent' ? `${sign}${delta.toFixed(1)}%` : `${sign}${delta.toFixed(2)}`;
  return { text, favorable };
}

export function resolveFacilityName(
  facility: FacilityReportData | undefined,
  manual: Pick<ManualInputs, 'facilityNameOverride'>,
): string {
  const override = manual.facilityNameOverride?.trim();
  if (override) return override;
  return facility?.providerName ?? 'Facility name';
}

export function manualValue(value: string | number | undefined, fallback = '—'): string {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value);
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
