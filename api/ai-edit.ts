import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from './lib/auth';
import { editLatex } from './lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  return withAuth(async (req, res) => {
    try {
      const { latex, prompt, jobDescription } = req.body;
      if (!latex) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'LaTeX code is required' } });
      if (!prompt) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Prompt is required' } });

      const result = await editLatex(latex, prompt, jobDescription);
      res.json({ updated_latex: result.updatedLatex });
    } catch (err: any) {
      res.status(502).json({ error: { code: 'AI_ERROR', message: err.message || 'AI edit failed' } });
    }
  })(req, res);
}
