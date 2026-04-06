import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from './lib/auth';
import { analyzeJob } from './lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  return withAuth(async (req, res) => {
    try {
      const { jobDescription } = req.body;
      if (!jobDescription) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Job description is required' } });

      const result = await analyzeJob(jobDescription);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: { code: 'AI_ERROR', message: err.message || 'Analysis failed' } });
    }
  })(req, res);
}
