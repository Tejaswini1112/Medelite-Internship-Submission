import type { NextFunction, Request, Response } from 'express';
import { CmsError } from '../cms/client.js';
import { FacilityNotFoundError, InvalidCcnError } from '../cms/facility.js';

interface ApiError {
  status: number;
  code: string;
  message: string;
  retryable?: boolean;
}

function classify(err: unknown): ApiError {
  if (err instanceof InvalidCcnError) {
    return { status: 400, code: 'INVALID_CCN', message: err.message };
  }
  if (err instanceof FacilityNotFoundError) {
    return {
      status: 404,
      code: 'NOT_FOUND',
      message: 'No facility matches that CCN in the CMS Care Compare database.',
    };
  }
  if (err instanceof CmsError) {
    const message =
      err.status === 504
        ? 'The CMS data service timed out. Please retry.'
        : 'The CMS data service is temporarily unavailable. Please retry.';
    return { status: 502, code: 'CMS_UPSTREAM', message, retryable: true };
  }
  return { status: 500, code: 'INTERNAL', message: 'Something went wrong generating the report.' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const apiError = classify(err);
  // Log full error server-side; never leak internals to the client.
  if (apiError.status >= 500 || apiError.code === 'CMS_UPSTREAM') {
    console.error('[error]', apiError.code, err);
  }
  res.status(apiError.status).json({
    error: apiError.code,
    message: apiError.message,
    retryable: apiError.retryable ?? false,
  });
}
