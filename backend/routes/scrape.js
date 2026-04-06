const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraperService');
const { apiError } = require('../utils/errorHandler');

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return apiError(res, 400, 'VALIDATION_ERROR', 'URL is required');
    }

    const result = await scraperService.scrapeJob(url);
    res.json(result);

  } catch (error) {
    console.error('[scrape] Error:', error.message);
    const code = error.type === 'SCRAPE_FAILED' ? 'SCRAPE_FAILED' : 'INTERNAL_ERROR';
    return apiError(res, 502, code, error.message || 'Failed to scrape job posting', error.details || null);
  }
});

module.exports = router;
