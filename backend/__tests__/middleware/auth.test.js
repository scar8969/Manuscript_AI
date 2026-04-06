const authMiddleware = require('../../middleware/auth');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-for-jwt';
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('returns 401 when no authorization header is present', () => {
    req = { headers: {} };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header does not start with Bearer', () => {
    req = { headers: { authorization: 'Token abc123' } };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    req = { headers: { authorization: 'Bearer invalid-token' } };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INVALID_TOKEN', message: 'Access token is invalid or expired' }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next() with valid token', () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: 'user-123', email: 'test@test.com' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );
    req = { headers: { authorization: `Bearer ${token}` } };

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'user-123', email: 'test@test.com' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when Bearer prefix has no token after it', () => {
    req = { headers: { authorization: 'Bearer ' } };

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
