import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFacilityReport } from '../../server/src/cms/facility.js';
import { sendError } from '../_error.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const raw = req.query.ccn;
    const ccn = Array.isArray(raw) ? raw[0] : raw ?? '';
    const report = await getFacilityReport(ccn);
    res.status(200).json(report);
  } catch (err) {
    sendError(res, err);
  }
}
