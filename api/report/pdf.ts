import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generatePdf } from '../../server/src/report/pdf.js';
import { sendError } from '../_error.js';
import { safeName, validatePayload } from '../_report.js';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST.' });
    return;
  }
  try {
    const payload = validatePayload(req.body);
    const pdf = await generatePdf(payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(payload, 'pdf')}"`);
    res.status(200).send(pdf);
  } catch (err) {
    sendError(res, err);
  }
}
