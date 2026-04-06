import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from './lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  return withAuth(async (req, res) => {
    // Python scraper requires subprocess — not available on Vercel serverless.
    // Proxy to your self-hosted backend. Set SCRAPE_SERVICE_URL env var on Vercel.

    const scrapeUrl = process.env.SCRAPE_SERVICE_URL;

    if (!scrapeUrl) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Job scraping is not available on serverless. Set SCRAPE_SERVICE_URL to your self-hosted backend.',
          details: 'Deploy the backend on Railway, Render, or Fly.io and set the SCRAPE_SERVICE_URL environment variable.'
        }
      });
    }

    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'URL is required' } });

      const backendRes = await fetch(`${scrapeUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify({ url })
      });

      if (!backendRes.ok) {
        const err = await backendRes.json().catch(() => ({}));
        return res.status(backendRes.status).json(err);
      }

      const data = await backendRes.json();
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: { code: 'SCRAPE_SERVICE_ERROR', message: err.message || 'Failed to reach scrape service' } });
    }
  })(req, res);
}
