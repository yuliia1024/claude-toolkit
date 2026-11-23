import { Router } from 'express';
import { query } from '../db.js';

export interface Order {
  id: string;
  customer_email: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  total_cents: number;
  created_at: string;
}

export const ordersRouter = Router();

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const rows = await query<Order>('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
