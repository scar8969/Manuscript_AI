import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from './lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  return withAuth(async (req, res, user) => {
    // LaTeX compilation requires pdflatex binary — not available on Vercel serverless.
    // In production, proxy this to your self-hosted backend (Railway/Render/Fly.io).
    // Set COMPILE_SERVICE_URL env var on Vercel to your backend's compile endpoint.

    const compileUrl = process.env.COMPILE_SERVICE_URL;

    if (!compileUrl) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'LaTeX compilation is not available on serverless. Set COMPILE_SERVICE_URL to your self-hosted backend.',
          details: 'Deploy the backend on Railway, Render, or Fly.io and set the COMPILE_SERVICE_URL environment variable.'
        }
      });
    }

    try {
      const backendRes = await fetch(`${compileUrl}/api/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(req.body)
      });

      if (!backendRes.ok) {
        const err = await backendRes.json().catch(() => ({}));
        return res.status(backendRes.status).json(err);
      }

      res.setHeader('Content-Type', 'application/pdf');
      const buffer = await backendRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(502).json({
        error: { code: 'COMPILE_SERVICE_ERROR', message: err.message || 'Failed to reach compile service' }
      });
    }
  })(req, res);
}
