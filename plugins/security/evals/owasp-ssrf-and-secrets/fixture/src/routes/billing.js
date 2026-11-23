import { Router } from 'express';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

export const billingRouter = Router();

billingRouter.post('/billing/upgrade', requireAuth, async (req, res) => {
  const response = await fetch(`${config.payfluxBaseUrl}/subscriptions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.payfluxApiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ customer: req.user.sub, plan: 'pro' }),
  });
  res.status(response.ok ? 202 : 502).json({ ok: response.ok });
});
