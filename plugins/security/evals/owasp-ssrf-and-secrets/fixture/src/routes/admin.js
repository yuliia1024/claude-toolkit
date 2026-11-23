import { Router } from 'express';
import { users } from '../db.js';

export const adminRouter = Router();

adminRouter.get('/admin/users', (req, res) => {
  res.json([...users.values()]);
});

adminRouter.patch('/admin/users/:id/plan', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  user.plan = req.body?.plan ?? user.plan;
  res.json(user);
});

adminRouter.delete('/admin/users/:id', (req, res) => {
  users.delete(req.params.id);
  res.status(204).end();
});
