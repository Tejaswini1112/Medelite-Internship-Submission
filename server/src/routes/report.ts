import { Router, type Request, type Response, type NextFunction } from 'express';
import type { ReportPayload } from '../types.js';
import { generatePdf } from '../report/pdf.js';
import { generateDocx } from '../report/docx.js';
import { renderReportHtml } from '../report/template.js';

export const reportRouter = Router();

function validatePayload(body: unknown): ReportPayload {
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

function safeName(payload: ReportPayload, ext: string): string {
  const base = (payload.manual.facilityNameOverride || payload.facility.providerName || payload.facility.ccn)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return `Facility_Assessment_${base || payload.facility.ccn}.${ext}`;
}

reportRouter.post('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = validatePayload(req.body);
    const pdf = await generatePdf(payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(payload, 'pdf')}"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

reportRouter.post('/docx', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = validatePayload(req.body);
    const docx = await generateDocx(payload);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(payload, 'docx')}"`);
    res.send(docx);
  } catch (err) {
    next(err);
  }
});

// HTML preview endpoint (handy for debugging PDF parity).
reportRouter.post('/preview', (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = validatePayload(req.body);
    res.setHeader('Content-Type', 'text/html');
    res.send(renderReportHtml(payload));
  } catch (err) {
    next(err);
  }
});
