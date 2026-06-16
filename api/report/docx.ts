import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDocx } from '../../server/src/report/docx.js';
import { sendError } from '../_error.js';
import { safeName, validatePayload } from '../_report.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST.' });
    return;
  }
  try {
    const payload = validatePayload(req.body);
    const docx = await generateDocx(payload);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${safeName(payload, 'docx')}"`);
    res.status(200).send(docx);
  } catch (err) {
    sendError(res, err);
  }
}
