import { config } from '../config.js';

const BASE = 'https://data.cms.gov/provider-data/api/1/datastore/query';

export class CmsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'CmsError';
  }
}

interface QueryCondition {
  property: string;
  value: string;
  operator?: string;
}

interface DatastoreResponse<T> {
  results: T[];
  count?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Query a CMS Provider Data Catalog datastore distribution with conditions.
 * Implements a 30s timeout (AbortController) and exponential backoff with
 * jitter on 429 / 5xx / network errors.
 */
export async function queryDataset<T = Record<string, string>>(
  datasetId: string,
  conditions: QueryCondition[] = [],
  limit = 50,
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  conditions.forEach((cond, i) => {
    params.set(`conditions[${i}][property]`, cond.property);
    params.set(`conditions[${i}][value]`, cond.value);
    params.set(`conditions[${i}][operator]`, cond.operator ?? '=');
  });

  const url = `${BASE}/${datasetId}/0?${params.toString()}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.cmsMaxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.cmsTimeoutMs);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429 || res.status >= 500) {
        throw new CmsError(`CMS upstream returned ${res.status}`, res.status, true);
      }
      if (!res.ok) {
        throw new CmsError(`CMS upstream returned ${res.status}`, res.status, false);
      }

      const body = (await res.json()) as DatastoreResponse<T>;
      return body.results ?? [];
    } catch (err) {
      clearTimeout(timeout);
      lastError = err as Error;

      const isAbort = (err as Error)?.name === 'AbortError';
      const retryable = isAbort || (err instanceof CmsError ? err.retryable : true);

      if (!retryable || attempt === config.cmsMaxRetries) break;

      // Exponential backoff with jitter: 300ms, 600ms, 1200ms, ...
      const backoff = 300 * 2 ** attempt + Math.random() * 200;
      await sleep(backoff);
    }
  }

  if (lastError instanceof CmsError) throw lastError;
  if (lastError?.name === 'AbortError') {
    throw new CmsError('CMS request timed out', 504, true);
  }
  throw new CmsError(lastError?.message ?? 'CMS request failed', 502, true);
}
