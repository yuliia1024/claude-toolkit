import type { NextFunction, Request, Response } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.header('x-api-key');
  if (!key || key !== process.env.SUPPORT_API_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}
