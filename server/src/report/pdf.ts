import type { Browser } from 'puppeteer-core';
import type { ReportPayload } from '../types.js';
import { renderReportHtml } from './template.js';

let browserPromise: Promise<Browser> | null = null;

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Launch a headless browser. Locally we use the full `puppeteer` (bundled
 * Chromium); on serverless (Vercel/Lambda) we use `puppeteer-core` with
 * `@sparticuz/chromium`, which ships a Lambda-compatible Chromium binary.
 */
async function launch(): Promise<Browser> {
  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser;
  }
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }) as unknown as Browser;
}

/** Reuse a single headless browser across requests for performance. */
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launch();
  }
  return browserPromise;
}

export async function generatePdf(payload: ReportPayload): Promise<Buffer> {
  const html = renderReportHtml(payload);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
