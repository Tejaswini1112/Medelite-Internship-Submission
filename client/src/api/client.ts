import type { FacilityReportData, ReportPayload } from '../types';

const CLIENT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('The request timed out. Please check your connection and retry.', 'TIMEOUT', 0, true);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function parseError(res: Response): Promise<never> {
  let body: { error?: string; message?: string; retryable?: boolean } = {};
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  throw new ApiError(
    body.message ?? `Request failed (${res.status})`,
    body.error ?? 'ERROR',
    res.status,
    body.retryable ?? res.status >= 500,
  );
}

export async function fetchFacility(ccn: string): Promise<FacilityReportData> {
  return withTimeout(async (signal) => {
    const res = await fetch(`/api/facility/${encodeURIComponent(ccn)}`, { signal });
    if (!res.ok) await parseError(res);
    return (await res.json()) as FacilityReportData;
  });
}

async function downloadReport(kind: 'pdf' | 'docx', payload: ReportPayload): Promise<void> {
  const res = await fetch(`/api/report/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `facility-assessment.${kind}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const downloadPdf = (payload: ReportPayload) => downloadReport('pdf', payload);
export const downloadDocx = (payload: ReportPayload) => downloadReport('docx', payload);
