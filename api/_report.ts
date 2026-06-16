import type { ReportPayload } from '../server/src/types.js';

export function validatePayload(body: unknown): ReportPayload {
  const payload = body as Partial<ReportPayload>;
  if (!payload || typeof payload !== 'object' || !payload.facility || !payload.facility.ccn) {
    throw Object.assign(new Error('A facility payload is required.'), { status: 400 });
  }
  return {
    facility: payload.facility,
    manual: payload.manual ?? {},
    chartImage: payload.chartImage,
  };
}

export function safeName(payload: ReportPayload, ext: string): string {
  const base = (payload.manual.facilityNameOverride || payload.facility.providerName || payload.facility.ccn)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return `Facility_Assessment_${base || payload.facility.ccn}.${ext}`;
}
