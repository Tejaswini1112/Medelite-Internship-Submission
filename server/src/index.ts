import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { apiKeyGuard } from './middleware/apiKey.js';
import { errorHandler } from './middleware/errorHandler.js';
import { facilityRouter } from './routes/facility.js';
import { reportRouter } from './routes/report.js';
import { closeBrowser } from './report/pdf.js';

const app = express();

app.use(compression());
app.use(express.json({ limit: '5mb' }));

const origins = config.corsOrigin.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: origins.includes('*') ? true : origins,
  }),
);

// Basic rate limiting to protect upstream CMS and our own resources.
const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down and retry shortly.' },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'medelite-facility-snapshot', time: new Date().toISOString() });
});

app.use('/api', limiter, apiKeyGuard);
app.use('/api/facility', facilityRouter);
app.use('/api/report', reportRouter);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[server] INFINITE — Managed by MEDELITE API listening on :${config.port}`);
});

async function shutdown(signal: string) {
  console.log(`[server] ${signal} received, shutting down...`);
  await closeBrowser().catch(() => undefined);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
