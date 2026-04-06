const express = require('express');
const request = require('supertest');

// Mock openai to prevent real API initialization
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

const aiEditRouter = require('../../routes/aiEdit');
const aiService = require('../../services/aiService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-edit', aiEditRouter);
  return app;
}

describe('POST /api/ai-edit', () => {
  beforeEach(() => {
    aiService.editLatex.mockReset();
  });

  it('returns updated latex on success', async () => {
    aiService.editLatex.mockResolvedValue({ updatedLatex: '\\updated{content}' });

    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\original{content}', prompt: 'Make it better' });

    expect(res.status).toBe(200);
    expect(res.body.updated_latex).toBe('\\updated{content}');
  });

  it('returns 400 when latex is missing', async () => {
    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ prompt: 'Make it better' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when prompt is missing', async () => {
    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\documentclass{article}' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when latex is not a string', async () => {
    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: 123, prompt: 'edit' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when latex exceeds max input size', async () => {
    process.env.MAX_INPUT_SIZE = '100';
    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: 'x'.repeat(101), prompt: 'edit' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LATEX_TOO_LARGE');
    delete process.env.MAX_INPUT_SIZE;
  });

  it('returns 502 with original latex on AI_ERROR', async () => {
    aiService.editLatex.mockImplementation(() => {
      throw { type: 'AI_ERROR', message: 'Model unavailable', originalLatex: '\\original' };
    });

    const res = await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\original', prompt: 'edit' });

    expect(res.status).toBe(502);
    expect(res.body.updated_latex).toBe('\\original');
    expect(res.body.error.code).toBe('AI_ERROR');
  });

  it('passes jobDescription to aiService', async () => {
    aiService.editLatex.mockResolvedValue({ updatedLatex: '\\result' });

    await request(createApp())
      .post('/api/ai-edit')
      .set('Authorization', 'Bearer valid-token')
      .send({
        latex: '\\latex',
        prompt: 'tailor',
        jobDescription: 'Senior Engineer role'
      });

    expect(aiService.editLatex).toHaveBeenCalledWith('\\latex', 'tailor', 'Senior Engineer role');
  });
});
