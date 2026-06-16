import dotenv from 'dotenv';

dotenv.config();

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  apiKey: process.env.API_KEY?.trim() || '',
  cacheTtlSeconds: num(process.env.CACHE_TTL_SECONDS, 3600),
  cmsTimeoutMs: num(process.env.CMS_TIMEOUT_MS, 30000),
  cmsMaxRetries: num(process.env.CMS_MAX_RETRIES, 3),
} as const;
