import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

/**
 * Optional API key gate for internal use. Disabled when API_KEY is empty.
 * Accepts the key via `x-api-key` header or `api_key` query param.
 */
export function apiKeyGuard(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiKey) {
    next();
    return;
  }
  const provided = (req.header('x-api-key') ?? req.query.api_key) as string | undefined;
  if (provided && provided === config.apiKey) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized', message: 'A valid API key is required.' });
}
