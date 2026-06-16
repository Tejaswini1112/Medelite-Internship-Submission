import type { FacilityReportData, ManualInputs, MetricLine } from '../types.js';

export const NOT_AVAILABLE = 'Data not available';

export function formatMetricValue(value: number | null, unit: 'percent' | 'rate'): string {
  if (value === null || Number.isNaN(value)) return NOT_AVAILABLE;
  return unit === 'percent' ? `${value.toFixed(1)}%` : value.toFixed(2);
}

export function formatStars(value: number | null): string {
  if (value === null) return NOT_AVAILABLE;
  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)} (${value}/5)`;
}

/**
 * Compute the variance of a facility value vs a benchmark. For both measure
 * families a LOWER value is better, so a negative delta is favorable.
 */
export function variance(metric: MetricLine, benchmark: 'state' | 'national') {
  const base = benchmark === 'state' ? metric.stateAverage : metric.nationalAverage;
  if (metric.facility === null || base === null) {
    return { text: NOT_AVAILABLE, favorable: null as boolean | null, delta: null as number | null };
  }
  const delta = metric.facility - base;
  const favorable = delta <= 0;
  const sign = delta > 0 ? '+' : '';
  const formatted = metric.unit === 'percent'
    ? `${sign}${delta.toFixed(1)}%`
    : `${sign}${delta.toFixed(2)}`;
  return { text: formatted, favorable, delta };
}

/** Resolve the facility name honoring the manual override. */
export function resolveFacilityName(facility: FacilityReportData, manual: ManualInputs): string {
  const override = manual.facilityNameOverride?.trim();
  return override && override.length > 0 ? override : facility.providerName;
}

export function manualValue(value: string | number | undefined, fallback = '—'): string {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value);
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
