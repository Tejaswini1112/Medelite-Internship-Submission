import type { VercelResponse } from '@vercel/node';
import { CmsError } from '../server/src/cms/client.js';
import { FacilityNotFoundError, InvalidCcnError } from '../server/src/cms/facility.js';

/** Mirror of the Express error handler for the serverless functions. */
export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof InvalidCcnError) {
    res.status(400).json({ error: 'INVALID_CCN', message: err.message, retryable: false });
    return;
  }
  if (err instanceof FacilityNotFoundError) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'No facility matches that CCN in the CMS Care Compare database.',
      retryable: false,
    });
    return;
  }
  if (err instanceof CmsError) {
    const message =
      err.status === 504
        ? 'The CMS data service timed out. Please retry.'
        : 'The CMS data service is temporarily unavailable. Please retry.';
    res.status(502).json({ error: 'CMS_UPSTREAM', message, retryable: true });
    return;
  }
  console.error('[api error]', err);
  res.status(500).json({
    error: 'INTERNAL',
    message: 'Something went wrong generating the report.',
    retryable: false,
  });
}
