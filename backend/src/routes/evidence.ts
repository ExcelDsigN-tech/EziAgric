import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { createEvidence, getEvidence } from '../controllers/evidence';

const router = Router();

const evidenceCreateLimiter = rateLimit({
  limit: 5,
  windowMs: 60_000,
  keyPrefix: 'evidence:create',
  keyResolver: (req) => req.params.tradeId ?? req.body?.tradeId,
});

router.post('/', requireAuth, evidenceCreateLimiter, createEvidence);
router.get('/:id', requireAuth, getEvidence);

export default router;
