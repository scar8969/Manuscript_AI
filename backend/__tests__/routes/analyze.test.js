const express = require('express');
const request = require('supertest');

jest.mock('openai', () => {
  const MockConstructor = function() {
    return { chat: { completions: { create: jest.fn() } } };
  };
  MockConstructor.default = MockConstructor;
  return MockConstructor;
});

jest.mock('../../services/aiService');
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user-123', email: 'test@test.com' };
  next();
});

const analyzeRouter = require('../../routes/analyze');
const aiService = require('../../services/aiService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/analyze', analyzeRouter);
  return app;
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    aiService.analyzeJob.mockReset();
  });

  it('returns analysis result on success', async () => {
    const analysis = { keywords: ['react'], requiredSkills: ['React'], experienceLevel: 'Mid' };
    aiService.analyzeJob.mockResolvedValue(analysis);

    const res = await request(createApp())
      .post('/api/analyze')
      .set('Authorization', 'Bearer valid-token')
      .send({ jobDescription: 'React Developer role' });

    expect(res.status).toBe(200);
    expect(res.body.keywords).toEqual(['react']);
  });

  it('returns 400 when jobDescription is missing', async () => {
    const res = await request(createApp())
      .post('/api/analyze')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 502 when AI service fails', async () => {
    aiService.analyzeJob.mockImplementation(() => {
      throw { type: 'AI_ERROR', message: 'Model overloaded' };
    });

    const res = await request(createApp())
      .post('/api/analyze')
      .set('Authorization', 'Bearer valid-token')
      .send({ jobDescription: 'Some job' });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_ERROR');
  });
});
