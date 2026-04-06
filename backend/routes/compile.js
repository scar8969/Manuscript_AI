const express = require('express');
const router = express.Router();
const latexService = require('../services/latexService');
const fileManager = require('../utils/fileManager');
const { apiError } = require('../utils/errorHandler');

router.post('/', async (req, res) => {
  try {
    const { latex } = req.body;

    if (!latex || typeof latex !== 'string') {
      return apiError(res, 400, 'VALIDATION_ERROR', 'LaTeX code is required');
    }

    if (latex.length > parseInt(process.env.MAX_INPUT_SIZE || 1000000)) {
      return apiError(res, 400, 'LATEX_TOO_LARGE', 'Input exceeds maximum size limit');
    }

    // Block dangerous LaTeX commands that enable shell escape
    if (/\\write18|\\immediate\s*\\write18|shell-escape|\\input\|/.test(latex)) {
      return apiError(res, 400, 'VALIDATION_ERROR', 'LaTeX contains forbidden commands');
    }

    const result = await latexService.compileLatex(latex);
    const pdfBuffer = fileManager.readFile(result.pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + result.filename + '.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[compile] Error:', error.message);

    if (error.type === 'LATEX_ERROR') {
      return apiError(res, 422, 'LATEX_COMPILATION_ERROR', 'LaTeX compilation failed', error.log);
    }

    return apiError(res, 500, 'INTERNAL_ERROR', error.message || 'Internal server error');
  }
});

module.exports = router;
