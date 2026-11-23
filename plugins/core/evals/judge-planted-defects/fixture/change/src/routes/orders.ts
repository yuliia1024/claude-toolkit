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

// SUP-212: order search for the support console.
// Registered before '/:id' so "search" is not treated as an order id.
ordersRouter.get('/search', async (req, res, next) => {
  const customer = typeof req.query.customer === 'string' ? req.query.customer.trim() : '';
  if (!customer || !customer.includes('@')) {
    res.status(400).json({ error: 'invalid_customer' });
    return;
  }

  try {
    const items = await query<Order>(
      "SELECT * FROM orders WHERE customer_email = '" + customer + "' ORDER BY created_at DESC",
    );
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

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
