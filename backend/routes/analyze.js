const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { apiError } = require('../utils/errorHandler');

router.post('/', async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) return apiError(res, 400, 'VALIDATION_ERROR', 'Job description is required');
    const result = await aiService.analyzeJob(jobDescription);
    return res.json(result);
  } catch (error) {
    console.error('[analyze] Error:', error.message);
    return apiError(res, 502, 'AI_ERROR', error.message || 'Job analysis failed');
  }
});

module.exports = router;
