const express = require('express');
const request = require('supertest');

jest.mock('../../services/scraperService');
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user-123', email: 'test@test.com' };
  next();
});

const scrapeRouter = require('../../routes/scrape');
const scraperService = require('../../services/scraperService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/scrape', scrapeRouter);
  return app;
}

describe('POST /api/scrape', () => {
  beforeEach(() => {
    scraperService.scrapeJob.mockReset();
  });

  it('returns scraped job data on success', async () => {
    const jobData = { job: { title: 'Engineer', company: 'Acme' }, source_website: 'https://example.com' };
    scraperService.scrapeJob.mockResolvedValue(jobData);

    const res = await request(createApp())
      .post('/api/scrape')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 'https://example.com/jobs/123' });

    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Engineer');
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(createApp())
      .post('/api/scrape')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when url is not a string', async () => {
    const res = await request(createApp())
      .post('/api/scrape')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 12345 });

    expect(res.status).toBe(400);
  });

  it('returns 502 when scraper fails', async () => {
    scraperService.scrapeJob.mockImplementation(() => {
      throw { type: 'SCRAPE_FAILED', message: 'Page not found', details: '404' };
    });

    const res = await request(createApp())
      .post('/api/scrape')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 'https://example.com/jobs/999' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('SCRAPE_FAILED');
    expect(res.body.error.details).toBe('404');
  });

  it('returns 502 for unknown errors', async () => {
    scraperService.scrapeJob.mockImplementation(() => {
      throw { message: 'Unknown failure' };
    });

    const res = await request(createApp())
      .post('/api/scrape')
      .set('Authorization', 'Bearer valid-token')
      .send({ url: 'https://example.com/job' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
