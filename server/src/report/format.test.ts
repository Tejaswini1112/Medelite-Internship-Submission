import { describe, expect, it } from 'vitest';
import { formatMetricValue, formatStars, variance } from './format.js';
import type { MetricLine } from '../types.js';

const baseMetric: MetricLine = {
  key: 'strHospitalization',
  label: 'Short-Stay Hospitalization',
  group: 'short-stay',
  kind: 'hospitalization',
  unit: 'percent',
  measureCode: '521',
  facility: 18.7,
  nationalAverage: 21.5,
  stateAverage: 23.8,
};

describe('formatMetricValue', () => {
  it('formats percentages to one decimal', () => {
    expect(formatMetricValue(18.7, 'percent')).toBe('18.7%');
  });
  it('formats rates to two decimals', () => {
    expect(formatMetricValue(1.86, 'rate')).toBe('1.86');
  });
  it('returns the not-available label for null', () => {
    expect(formatMetricValue(null, 'percent')).toBe('Data not available');
  });
});

describe('formatStars', () => {
  it('renders filled and empty stars with score', () => {
    expect(formatStars(3)).toBe('★★★☆☆ (3/5)');
  });
  it('handles missing rating', () => {
    expect(formatStars(null)).toBe('Data not available');
  });
});

describe('variance', () => {
  it('marks a lower facility value as favorable', () => {
    const v = variance(baseMetric, 'national');
    expect(v.favorable).toBe(true);
    expect(v.text).toBe('-2.8%');
  });

  it('marks a higher facility value as unfavorable', () => {
    const v = variance({ ...baseMetric, facility: 25 }, 'national');
    expect(v.favorable).toBe(false);
    expect(v.text).toBe('+3.5%');
  });

  it('returns not-available when a value is missing', () => {
    const v = variance({ ...baseMetric, facility: null }, 'national');
    expect(v.favorable).toBeNull();
  });
});
