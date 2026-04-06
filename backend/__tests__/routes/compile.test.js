const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const fileManager = require('../../utils/fileManager');

jest.mock('../../services/latexService');
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user-123', email: 'test@test.com' };
  next();
});

const compileRouter = require('../../routes/compile');
const latexService = require('../../services/latexService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/compile', compileRouter);
  return app;
}

describe('POST /api/compile', () => {
  beforeEach(() => {
    latexService.compileLatex.mockReset();
  });

  afterEach(() => {
    // Cleanup generated test files
    const tempDir = fileManager.TEMP_DIR;
    try {
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith('resume_'));
      files.forEach(f => {
        try { fs.unlinkSync(path.join(tempDir, f)); } catch {}
      });
    } catch {}
  });

  it('returns PDF buffer on successful compilation', async () => {
    const tempDir = fileManager.TEMP_DIR;
    const fakePdfPath = path.join(tempDir, 'test_result.pdf');
    fs.writeFileSync(fakePdfPath, '%PDF-1.4 fake content');

    latexService.compileLatex.mockResolvedValue({
      pdfPath: fakePdfPath,
      filename: 'test_result'
    });

    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\documentclass{article}' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('returns 400 when latex is missing', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when latex is not a string', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: 42 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when latex exceeds max input size', async () => {
    process.env.MAX_INPUT_SIZE = '100';
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: 'x'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LATEX_TOO_LARGE');
    delete process.env.MAX_INPUT_SIZE;
  });

  it('returns 400 for dangerous \\write18 command', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\write18{rm -rf /}' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for shell-escape command', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: 'some text with shell-escape enabled' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for \\immediate\\write18 variant', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\immediate\\write18{whoami}' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for pipe \\input| command', async () => {
    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\input|whoami' });

    expect(res.status).toBe(400);
  });

  it('returns 422 with LaTeX error details on compilation failure', async () => {
    latexService.compileLatex.mockImplementation(() => {
      throw { type: 'LATEX_ERROR', message: 'LaTeX compilation failed', log: '! Undefined control sequence\nl.10 \\bad' };
    });

    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\badcommand' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('LATEX_COMPILATION_ERROR');
    expect(res.body.error.details).toContain('! Undefined control sequence');
  });

  it('returns 500 on unexpected errors', async () => {
    latexService.compileLatex.mockImplementation(() => {
      throw new Error('Something unexpected');
    });

    const res = await request(createApp())
      .post('/api/compile')
      .set('Authorization', 'Bearer valid-token')
      .send({ latex: '\\documentclass{article}' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
