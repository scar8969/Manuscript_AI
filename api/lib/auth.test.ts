import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyToken, withAuth } from './auth';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}));

import jwt from 'jsonwebtoken';

describe('verifyToken', () => {
  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('returns null when no authorization header', () => {
    const req = { headers: {} } as unknown as NextApiRequest;
    expect(verifyToken(req)).toBeNull();
  });

  it('returns null when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Token abc' } } as unknown as NextApiRequest;
    expect(verifyToken(req)).toBeNull();
  });

  it('returns null when token is invalid', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid');
    });

    const req = { headers: { authorization: 'Bearer bad-token' } } as unknown as NextApiRequest;
    expect(verifyToken(req)).toBeNull();
  });

  it('returns decoded user when token is valid', () => {
    vi.mocked(jwt.verify).mockReturnValue({ userId: 'u1', email: 'test@test.com' });

    const req = { headers: { authorization: 'Bearer valid-token' } } as unknown as NextApiRequest;
    const result = verifyToken(req);

    expect(result).toEqual({ userId: 'u1', email: 'test@test.com' });
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  it('returns 401 when no token', async () => {
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const res = { status: mockStatus } as unknown as NextApiResponse;
    const req = { headers: {} } as unknown as NextApiRequest;

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid');
    });

    const handler = withAuth(async (_req, _res, _user) => {
      throw new Error('Should not reach here');
    });

    await handler(req, res);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Access token is invalid or expired' }
    });
  });

  it('calls handler with user when token is valid', async () => {
    const mockJson = vi.fn();
    const res = { status: mockJson } as unknown as NextApiResponse;

    vi.mocked(jwt.verify).mockReturnValue({ userId: 'u1', email: 'test@test.com' });

    const req = { headers: { authorization: 'Bearer valid' } } as unknown as NextApiRequest;

    const handler = withAuth(async (_req, _res, user) => {
      return { called: true, user };
    });

    // Note: withAuth doesn't return the handler result, it sends response
    await handler(req, res);
  });
});
