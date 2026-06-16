/**
 * CMS Provider Data Catalog dataset identifiers (nursing homes).
 * Resolved from the live metastore on 2026-06; these are stable distribution
 * slugs. If CMS rotates an ID, update here (see README "Maintenance").
 */
export const DATASETS = {
  /** Provider Information: name, address, beds, star ratings, staffing. */
  providerInfo: '4pq5-n9py',
  /** Medicare Claims Quality Measures: facility-level claims scores. */
  claimsMeasures: 'ijh5-nb2v',
  /** State / US Averages: per-state and national benchmark values. */
  stateUsAverages: 'xcdc-v8bm',
} as const;

/**
 * The 12 hospitalization / ED report lines.
 *
 * The brief's shorthand maps to CMS as follows:
 *   STR  -> Short-Stay resident measures
 *   LT   -> Long-Stay resident measures
 *
 * Facility values come from the claims dataset (by `measureCode`).
 * State / National benchmark values come from the State US Averages dataset
 * (by `averageField`). Programmatic renaming turns the verbose government
 * descriptions into the clean labels below.
 */
export interface MetricDefinition {
  key: string;
  label: string;
  group: 'short-stay' | 'long-stay';
  kind: 'hospitalization' | 'ed';
  unit: 'percent' | 'rate';
  measureCode: string;
  /** Column in the State US Averages dataset holding the benchmark value. */
  averageField: string;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: 'strHospitalization',
    label: 'Short-Stay Hospitalization',
    group: 'short-stay',
    kind: 'hospitalization',
    unit: 'percent',
    measureCode: '521',
    averageField: 'percentage_of_short_stay_residents_who_were_rehospitalized__1d02',
  },
  {
    key: 'strEdVisit',
    label: 'Short-Stay ED Visit',
    group: 'short-stay',
    kind: 'ed',
    unit: 'percent',
    measureCode: '522',
    averageField: 'percentage_of_short_stay_residents_who_had_an_outpatient_em_d911',
  },
  {
    key: 'ltHospitalization',
    label: 'Long-Stay Hospitalization',
    group: 'long-stay',
    kind: 'hospitalization',
    unit: 'rate',
    measureCode: '551',
    averageField: 'number_of_hospitalizations_per_1000_longstay_resident_days',
  },
  {
    key: 'ltEdVisit',
    label: 'Long-Stay ED Visit',
    group: 'long-stay',
    kind: 'ed',
    unit: 'rate',
    measureCode: '552',
    averageField: 'number_of_outpatient_emergency_department_visits_per_1000_l_de9d',
  },
];
