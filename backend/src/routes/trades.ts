import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { Trade } from '../models/Trade';
import { buildPriceWarning } from '../services/priceFeedService';

const router = Router();

// Create a new trade
router.post(
  '/',
  authenticate,
  [
    body('commodity').isString().notEmpty(),
    body('quantity').isNumeric().isFloat({ gt: 0 }),
    body('price').isNumeric().isFloat({ gt: 0 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { commodity, quantity, price } = req.body;
      const perUnitPrice = Number(price) / Number(quantity);

      const trade = await Trade.create({
        ...req.body,
        userId: (req as any).user?.id,
      });

      // Informational only — never blocks trade creation.
      const priceWarning = await buildPriceWarning(commodity, perUnitPrice);

      return res.status(201).json({
        trade,
        ...(priceWarning ? { priceWarning } : {}),
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create trade' });
    }
  }
);

export default router;
