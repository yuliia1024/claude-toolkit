import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const previewRouter = Router();

// Fetch a page and pull its <title> + og:image for the link card.
previewRouter.get('/preview', requireAuth, async (req, res) => {
  const target = req.query.url;
  if (typeof target !== 'string' || target.length === 0) {
    return res.status(400).json({ error: 'url_required' });
  }
  const response = await fetch(target, { redirect: 'follow' });
  const html = await response.text();
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? null;
  const image = /property="og:image" content="([^"]+)"/i.exec(html)?.[1] ?? null;
  return res.json({ title, image, status: response.status });
});

// Avatar for a GitHub handle — fixed host, handle is URL-encoded.
previewRouter.get('/avatar/:handle', requireAuth, async (req, res) => {
  const handle = encodeURIComponent(req.params.handle);
  const response = await fetch(`https://api.github.com/users/${handle}`);
  if (!response.ok) return res.status(404).json({ error: 'not_found' });
  const body = await response.json();
  return res.json({ avatarUrl: body.avatar_url });
});
