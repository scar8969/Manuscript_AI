const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { apiError } = require('../utils/errorHandler');

router.post('/', async (req, res) => {
  try {
    const { latex, prompt, jobDescription } = req.body;

    if (!latex || typeof latex !== 'string') {
      return apiError(res, 400, 'VALIDATION_ERROR', 'LaTeX code is required');
    }

    if (!prompt || typeof prompt !== 'string') {
      return apiError(res, 400, 'VALIDATION_ERROR', 'Prompt is required');
    }

    if (latex.length > parseInt(process.env.MAX_INPUT_SIZE || 1000000, 10)) {
      return apiError(res, 400, 'LATEX_TOO_LARGE', 'Input exceeds maximum size limit');
    }

    const result = await aiService.editLatex(latex, prompt, jobDescription);

    return res.json({ updated_latex: result.updatedLatex });
  } catch (error) {
    console.error('[ai-edit] Error:', error.message);

    if (error.type === 'AI_ERROR') {
      return res.status(502).json({
        updated_latex: error.originalLatex,
        error: { code: 'AI_ERROR', message: error.message }
      });
    }

    return apiError(res, 502, 'AI_ERROR', error.message || 'Internal server error');
  }
});

module.exports = router;
