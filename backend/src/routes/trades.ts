import { Router, Request, Response } from 'express';
import { idempotency, recordIdempotencyKey } from '../middleware/idempotency';

const router = Router();

router.post('/trades', idempotency, async (req: Request, res: Response) => {
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
