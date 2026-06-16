import { config } from '../config.js';
import { TtlCache } from '../cache.js';
import { CmsError, queryDataset } from './client.js';
import { DATASETS, METRIC_DEFINITIONS } from './datasets.js';
import type {
  FacilityReportData,
  MetricLine,
  StarRating,
} from '../types.js';

const cache = new TtlCache<FacilityReportData>(config.cacheTtlSeconds * 1000);

// State/National averages are identical for every facility and only change when
// CMS refreshes (monthly), so cache them globally to avoid re-fetching ~54 rows
// on every CCN lookup. Inflight de-duplication prevents a thundering herd.
const averagesCache = new TtlCache<Record<string, string>[]>(config.cacheTtlSeconds * 1000);
let averagesInflight: Promise<Record<string, string>[]> | null = null;

async function getStateAverages(): Promise<Record<string, string>[]> {
  const cached = averagesCache.get('all');
  if (cached) return cached;
  if (!averagesInflight) {
    averagesInflight = queryDataset<Record<string, string>>(DATASETS.stateUsAverages, [], 100)
      .then((rows) => {
        averagesCache.set('all', rows);
        return rows;
      })
      .finally(() => {
        averagesInflight = null;
      });
  }
  return averagesInflight;
}

export class FacilityNotFoundError extends Error {
  constructor(ccn: string) {
    super(`No CMS facility found for CCN ${ccn}`);
    this.name = 'FacilityNotFoundError';
  }
}

export class InvalidCcnError extends Error {
  constructor(raw: string) {
    super(`"${raw}" is not a valid CCN. Enter up to 6 digits.`);
    this.name = 'InvalidCcnError';
  }
}

/** Validate and normalize a CCN to a 6-character, zero-padded string. */
export function normalizeCcn(raw: string): string {
  const digits = String(raw ?? '').trim().replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 6) {
    throw new InvalidCcnError(raw);
  }
  return digits.padStart(6, '0');
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStar(value: unknown): StarRating {
  const n = toNumber(value);
  if (n === null) return null;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function buildCareCompareUrl(ccn: string, state: string | null): string {
  const base = `https://www.medicare.gov/care-compare/details/nursing-home/${ccn}`;
  // Matches the brief's sample output format, e.g. .../686123/view-all?state=FL
  return state ? `${base}/view-all?state=${state}` : base;
}

/**
 * Fetch, normalize and map a complete facility snapshot for a CCN.
 * Provider Information is required; claims metrics and benchmark averages are
 * best-effort and degrade gracefully (partial=true + warnings) on failure.
 */
export async function getFacilityReport(rawCcn: string): Promise<FacilityReportData> {
  const ccn = normalizeCcn(rawCcn);

  const cached = cache.get(ccn);
  if (cached) return cached;

  // Fetch all three CMS sources concurrently. Provider Information is required;
  // claims + benchmark averages are best-effort and degrade gracefully.
  const [providerResult, claimsResult, averagesResult] = await Promise.allSettled([
    queryDataset<Record<string, string>>(
      DATASETS.providerInfo,
      [{ property: 'cms_certification_number_ccn', value: ccn }],
      1,
    ),
    queryDataset<Record<string, string>>(
      DATASETS.claimsMeasures,
      [{ property: 'cms_certification_number_ccn', value: ccn }],
      50,
    ),
    getStateAverages(),
  ]);

  // Provider Information failure is fatal (re-throw so the client can retry).
  if (providerResult.status === 'rejected') {
    throw providerResult.reason;
  }
  const provider = providerResult.value[0];
  if (!provider) {
    throw new FacilityNotFoundError(ccn);
  }

  const warnings: string[] = [];
  const state = provider.state ?? null;

  let claims: Record<string, string>[] = [];
  if (claimsResult.status === 'fulfilled') {
    claims = claimsResult.value;
  } else {
    warnings.push('Claims-based hospitalization/ED metrics are temporarily unavailable from CMS.');
  }

  let nationRow: Record<string, string> | undefined;
  let stateRow: Record<string, string> | undefined;
  if (averagesResult.status === 'fulfilled') {
    const avgRows = averagesResult.value;
    nationRow = avgRows.find((r) => r.state_or_nation === 'NATION');
    stateRow = state ? avgRows.find((r) => r.state_or_nation === state) : undefined;
  } else {
    warnings.push('State / National benchmark averages are temporarily unavailable from CMS.');
  }

  const claimsByCode = new Map(claims.map((row) => [row.measure_code, row]));
  let measurePeriod: string | null = null;

  const metrics: MetricLine[] = METRIC_DEFINITIONS.map((def) => {
    const claim = claimsByCode.get(def.measureCode);
    // CMS publishes risk-adjusted scores as the headline number on Care Compare.
    const facility = toNumber(claim?.adjusted_score ?? claim?.observed_score);
    if (claim?.measure_period && !measurePeriod) measurePeriod = claim.measure_period;

    return {
      key: def.key,
      label: def.label,
      group: def.group,
      kind: def.kind,
      unit: def.unit,
      measureCode: def.measureCode,
      facility,
      nationalAverage: toNumber(nationRow?.[def.averageField]),
      stateAverage: toNumber(stateRow?.[def.averageField]),
      footnote: claim?.footnote_for_score || null,
    };
  });

  const report: FacilityReportData = {
    ccn,
    providerName: provider.provider_name ?? provider.legal_business_name ?? `Facility ${ccn}`,
    legalBusinessName: provider.legal_business_name ?? null,
    address: {
      street: provider.provider_address ?? null,
      city: provider.citytown ?? null,
      state,
      zip: provider.zip_code ?? null,
      full: provider.provider_address
        ? `${provider.provider_address}, ${provider.citytown ?? ''}, ${state ?? ''} ${provider.zip_code ?? ''}`.trim()
        : provider.location ?? null,
    },
    certifiedBeds: toNumber(provider.number_of_certified_beds),
    averageResidentsPerDay: toNumber(provider.average_number_of_residents_per_day),
    ownershipType: provider.ownership_type ?? null,
    telephone: provider.telephone_number ?? null,
    starRatings: {
      overall: toStar(provider.overall_rating),
      healthInspection: toStar(provider.health_inspection_rating),
      staffing: toStar(provider.staffing_rating),
      qualityMeasures: toStar(provider.qm_rating),
    },
    staffingHours: {
      totalNurse: toNumber(provider.reported_total_nurse_staffing_hours_per_resident_per_day),
      registeredNurse: toNumber(provider.reported_rn_staffing_hours_per_resident_per_day),
      lpn: toNumber(provider.reported_lpn_staffing_hours_per_resident_per_day),
      nurseAide: toNumber(provider.reported_nurse_aide_staffing_hours_per_resident_per_day),
    },
    metrics,
    careCompareUrl: buildCareCompareUrl(ccn, state),
    generatedAt: new Date().toISOString(),
    cmsProcessingDate: provider.processing_date ?? null,
    measurePeriod,
    partial: warnings.length > 0,
    warnings,
  };

  cache.set(ccn, report);
  return report;
}

export { CmsError };
