import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    session: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn()
  }
}));

vi.mock('../lib/auth', () => ({
  withAuth: (handler: Function) => async (req: NextApiRequest, res: NextApiResponse) => {
    req.user = { userId: 'user-123', email: 'test@test.com' };
    return handler(req, res, req.user);
  }
}));

import handler from './[...route]';
import prisma from '../lib/prisma';

function createRequest(method: string, body?: object, cookies?: Record<string, string>, query?: string[]): NextApiRequest {
  return {
    method,
    body: body || {},
    cookies: cookies || {},
    headers: {},
    query: query ? { route: query } : {}
  } as unknown as NextApiRequest;
}

function createResponse(): { res: NextApiResponse; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; setHeader: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const setHeader = vi.fn();
  const end = vi.fn();
  const status = vi.fn().mockReturnValue({ json, setHeader, end });
  return { res: { status, json, setHeader, end } as unknown as NextApiResponse, status, json, setHeader, end };
}

describe('auth API handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'test';
    process.env.REFRESH_TOKEN_SECRET = 'test';
  });

  it('returns 404 for unknown route', async () => {
    const { res, status, json } = createResponse();
    const req = createRequest('GET', {}, {}, ['unknown']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('returns 405 for invalid method on register', async () => {
    const { res, status } = createResponse();
    const req = createRequest('GET', {}, {}, ['register']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when register missing fields', async () => {
    const { res, status, json } = createResponse();
    const req = createRequest('POST', { email: 'test@test.com' }, {}, ['register']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' })
    }));
  });

  it('returns 400 when register email invalid', async () => {
    const { res, status, json } = createResponse();
    const req = createRequest('POST', { email: 'bad', password: '12345678', name: 'Test' }, {}, ['register']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when user already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', email: 'test@test.com' });

    const { res, status, json } = createResponse();
    const req = createRequest('POST', { email: 'test@test.com', password: 'password123', name: 'Test' }, {}, ['register']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'User already exists' })
    }));
  });

  it('returns 400 when login missing fields', async () => {
    const { res, status, json } = createResponse();
    const req = createRequest('POST', { email: 'test@test.com' }, {}, ['login']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when login invalid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', email: 'test@test.com', password: 'hash' });

    const { res, status } = createResponse();
    const req = createRequest('POST', { email: 'test@test.com', password: 'wrong' }, {}, ['login']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when refresh no token', async () => {
    const { res, status, json } = createResponse();
    const req = createRequest('POST', {}, {}, ['refresh']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ message: 'No refresh token' })
    }));
  });

  it('returns ok on logout', async () => {
    const { res, json } = createResponse();
    const req = createRequest('POST', {}, {}, ['logout']);

    await handler(req, res);

    expect(json).toHaveBeenCalledWith({ ok: true });
  });

  it('returns 405 for GET on logout', async () => {
    const { res, status } = createResponse();
    const req = createRequest('GET', {}, {}, ['logout']);

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(405);
  });
});
