import { Router, Request, Response } from 'express';
import { idempotency, recordIdempotencyKey } from '../middleware/idempotency';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const tradesLimiter = rateLimit({
  limit: 10,
  windowMs: 60_000,
  keyPrefix: 'trades',
  keyGenerator: (req: Request) => {
    const user = (req as Request & { user?: { id?: string | number } }).user;
    return user?.id !== undefined ? String(user.id) : undefined;
  },
});

router.post('/trades', tradesLimiter, idempotency, async (req: Request, res: Response) => {
  try {
    const trade = await createTrade(req.body);

    const idempotencyKey = res.locals.idempotencyKey as string | undefined;
    if (idempotencyKey) {
      recordIdempotencyKey(idempotencyKey, String(trade.id));
    }

    res.status(201).json(trade);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

async function createTrade(payload: unknown): Promise<{ id: string | number }> {
  // Existing trade creation logic lives here.
  throw new Error('createTrade not implemented');
}

export default router;
