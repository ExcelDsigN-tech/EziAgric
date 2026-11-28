import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 24 * 60 * 60 * 1000;

interface IdempotencyRecord {
  tradeId: string;
  createdAt: number;
}

const store = new Map<string, IdempotencyRecord>();

function pruneExpired(now: number): void {
  for (const [key, record] of store) {
    if (now - record.createdAt > WINDOW_MS) {
      store.delete(key);
    }
  }
}

/**
 * Records the trade ID created for a given idempotency key so that a
 * subsequent request with the same key can be rejected with 409 Conflict.
 */
export function recordIdempotencyKey(key: string, tradeId: string): void {
  const now = Date.now();
  pruneExpired(now);
  store.set(key, { tradeId, createdAt: now });
}

/**
 * Express middleware that enforces idempotency on trade creation.
 *
 * Reads the `X-Idempotency-Key` header. If the same key was seen within the
 * last 24 hours, responds with 409 Conflict and `{ existingTradeId }` instead
 * of allowing a duplicate trade to be created.
 */
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const rawKey = req.header('X-Idempotency-Key');
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';

  if (!key) {
    next();
    return;
  }

  const now = Date.now();
  pruneExpired(now);

  const existing = store.get(key);
  if (existing && now - existing.createdAt <= WINDOW_MS) {
    res.status(409).json({ existingTradeId: existing.tradeId });
    return;
  }

  // Expose the key to downstream handlers so they can record the created trade.
  res.locals.idempotencyKey = key;
  next();
}
