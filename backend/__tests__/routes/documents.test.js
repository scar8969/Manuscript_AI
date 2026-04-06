const express = require('express');
const request = require('supertest');

const mockPrisma = {
  document: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

jest.mock('../../prisma', () => mockPrisma);
jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'user-123', email: 'test@test.com' };
  next();
});

const documentsRouter = require('../../routes/documents');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/documents', documentsRouter);
  return app;
}

describe('GET /api/documents', () => {
  beforeEach(() => {
    mockPrisma.document.findMany.mockReset();
  });

  it('returns list of documents ordered by updatedAt desc', async () => {
    const docs = [
      { id: 'doc-2', title: 'Resume 2', updatedAt: new Date('2026-01-02') },
      { id: 'doc-1', title: 'Resume 1', updatedAt: new Date('2026-01-01') }
    ];
    mockPrisma.document.findMany.mockResolvedValue(docs);

    const res = await request(createApp())
      .get('/api/documents')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        orderBy: { updatedAt: 'desc' }
      })
    );
  });
});

describe('GET /api/documents/:id', () => {
  beforeEach(() => {
    mockPrisma.document.findFirst.mockReset();
  });

  it('returns document with jobContexts', async () => {
    mockPrisma.document.findFirst.mockResolvedValue({
      id: 'doc-1', title: 'Resume', latex: '\\latex', jobContexts: []
    });

    const res = await request(createApp())
      .get('/api/documents/doc-1')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('doc-1');
    expect(mockPrisma.document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', userId: 'user-123' },
        include: { jobContexts: true }
      })
    );
  });

  it('returns 404 when document not found', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    const res = await request(createApp())
      .get('/api/documents/nonexistent')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
  });
});

describe('POST /api/documents', () => {
  beforeEach(() => {
    mockPrisma.document.create.mockReset();
  });

  it('creates document with title and latex', async () => {
    mockPrisma.document.create.mockResolvedValue({
      id: 'doc-new', userId: 'user-123', title: 'My Resume', latex: '\\latex'
    });

    const res = await request(createApp())
      .post('/api/documents')
      .set('Authorization', 'Bearer token')
      .send({ title: 'My Resume', latex: '\\documentclass{article}' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('My Resume');
  });

  it('creates document with default title when none provided', async () => {
    mockPrisma.document.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'doc-new', ...data })
    );

    const res = await request(createApp())
      .post('/api/documents')
      .set('Authorization', 'Bearer token')
      .send({ latex: '\\latex content' });

    expect(res.status).toBe(200);
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Untitled Resume'
        })
      })
    );
  });

  it('returns 400 when latex is missing', async () => {
    const res = await request(createApp())
      .post('/api/documents')
      .set('Authorization', 'Bearer token')
      .send({ title: 'My Resume' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/documents/:id', () => {
  beforeEach(() => {
    mockPrisma.document.findFirst.mockReset();
    mockPrisma.document.update.mockReset();
  });

  it('updates document title', async () => {
    mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1', userId: 'user-123' });
    mockPrisma.document.update.mockResolvedValue({ id: 'doc-1', title: 'Updated Title' });

    const res = await request(createApp())
      .put('/api/documents/doc-1')
      .set('Authorization', 'Bearer token')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(mockPrisma.document.update).toHaveBeenCalled();
  });

  it('returns 404 when document not found', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    const res = await request(createApp())
      .put('/api/documents/nonexistent')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New Title' });

    expect(res.status).toBe(404);
    expect(mockPrisma.document.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/documents/:id', () => {
  beforeEach(() => {
    mockPrisma.document.findFirst.mockReset();
    mockPrisma.document.delete.mockReset();
  });

  it('deletes document and returns ok', async () => {
    mockPrisma.document.findFirst.mockResolvedValue({ id: 'doc-1', userId: 'user-123' });
    mockPrisma.document.delete.mockResolvedValue({});

    const res = await request(createApp())
      .delete('/api/documents/doc-1')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mockPrisma.document.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'doc-1' } })
    );
  });

  it('returns 404 when document not found', async () => {
    mockPrisma.document.findFirst.mockResolvedValue(null);

    const res = await request(createApp())
      .delete('/api/documents/nonexistent')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
    expect(mockPrisma.document.delete).not.toHaveBeenCalled();
  });
});
