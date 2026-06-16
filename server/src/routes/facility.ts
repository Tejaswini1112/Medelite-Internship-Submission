import { Router, type Request, type Response, type NextFunction } from 'express';
import { getFacilityReport } from '../cms/facility.js';

export const facilityRouter = Router();

facilityRouter.get('/:ccn', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getFacilityReport(req.params.ccn);
    res.json(report);
  } catch (err) {
    next(err);
  }
});
