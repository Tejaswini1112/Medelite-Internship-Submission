import type { Browser } from 'puppeteer-core';
import type { ReportPayload } from '../types.js';
import { renderReportHtml } from './template.js';

let browserPromise: Promise<Browser> | null = null;

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Launch a headless browser. Locally we use the full `puppeteer` (bundled
 * Chromium); on serverless (Vercel/Lambda) we use `puppeteer-core` with
 * `@sparticuz/chromium`, which ships a Lambda-compatible Chromium binary.
 *
 * Vercel Fluid Compute needs AWS_LAMBDA_JS_RUNTIME=nodejs22.x set in the
 * project env (Dashboard) so Sparticuz can locate bundled shared libraries.
 */
async function launchServerless(): Promise<Browser> {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = await import('puppeteer-core');

  chromium.setGraphicsMode = false;
  const executablePath = await chromium.executablePath();
  // Do not overwrite LD_LIBRARY_PATH — @sparticuz/chromium sets it to /tmp/al2023/lib
  // (or /tmp/al2/lib) at import time when AWS_LAMBDA_JS_RUNTIME is configured.

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  }) as unknown as Browser;
}

async function launchLocal(): Promise<Browser> {
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }) as unknown as Browser;
}

/** Reuse browser locally; on serverless launch fresh per request (cold-start safe). */
async function getBrowser(): Promise<Browser> {
  if (isServerless) return launchServerless();
  if (!browserPromise) browserPromise = launchLocal();
  return browserPromise;
}

export async function generatePdf(payload: ReportPayload): Promise<Buffer> {
  const html = renderReportHtml(payload);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: isServerless ? 'load' : 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
    if (isServerless) {
      await browser.close();
    }
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
