import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from './middleware/rateLimit';
import { requestLogger, logError } from './middleware/requestLogger';
import { idempotency } from './middleware/idempotency';
import healthRouter from './routes/health';
import tradesRouter from './routes/trades';
import evidenceRouter from './routes/evidence';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRouter);

// POST /trades: 10 req/min per authenticated user.
const tradesLimiter = rateLimit({
  limit: 10,
  windowMs: 60_000,
  prefix: 'trades',
  keyGenerator: (req) => (req as express.Request & { user?: { id?: string } }).user?.id,
});

// POST /evidence: 5 req/min per trade.
const evidenceLimiter = rateLimit({
  limit: 5,
  windowMs: 60_000,
  prefix: 'evidence',
  keyGenerator: (req) => {
    const tradeId = req.params?.tradeId ?? req.body?.tradeId ?? req.body?.trade_id;
    return typeof tradeId === 'string' && tradeId.length > 0 ? tradeId : undefined;
  },
});

app.use('/trades', tradesLimiter, idempotency, tradesRouter);
app.use('/evidence', evidenceLimiter, evidenceRouter);

// Structured error logging with stack trace and userId when available.
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError(err, req as express.Request & { requestId?: string; user?: { id?: string } });
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
