import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
import { links } from '../db.js';

export const linksRouter = Router();
linksRouter.use(requireAuth);

linksRouter.get('/links', (req, res) => {
  res.json([...links.values()].filter((l) => l.ownerId === req.user.sub));
});

linksRouter.post('/links', (req, res) => {
  const { url } = req.body ?? {};
  if (typeof url !== 'string') return res.status(400).json({ error: 'url_required' });
  const link = { id: randomUUID(), ownerId: req.user.sub, url };
  links.set(link.id, link);
  res.status(201).json(link);
});
