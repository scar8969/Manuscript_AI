const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

// Mock prisma before requiring routes
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  }
};

jest.mock('../../prisma', () => mockPrisma);
jest.mock('../../middleware/auth', () => {
  return (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@test.com' };
    next();
  };
});

const authRouter = require('../../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ password: '12345678', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', name: 'Test' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '12345678' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '12345678', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid email');
  });

  it('returns 400 for password shorter than 8 characters', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'short', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Password must be at least 8');
  });

  it('returns 400 when user already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@test.com' });

    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '12345678', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('User already exists');
  });

  it('returns user and accessToken on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test User'
    });
    mockPrisma.session.create.mockResolvedValue({});

    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.accessToken).toBeDefined();
  });

  it('sets refreshToken cookie on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test'
    });
    mockPrisma.session.create.mockResolvedValue({});

    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
  });

  it('creates a session in database on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test'
    });
    mockPrisma.session.create.mockResolvedValue({});

    await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test' });

    expect(mockPrisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1'
        })
      })
    );
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ password: '12345678' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
  });

  it('returns 401 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for wrong password', async () => {
    const bcrypt = require('bcrypt');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', password: 'hashed-pass'
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  it('returns user and accessToken on successful login', async () => {
    const bcrypt = require('bcrypt');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test', password: 'hashed-pass'
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    mockPrisma.session.create.mockResolvedValue({});

    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.accessToken).toBeDefined();
  });
});

describe('POST /api/auth/logout', () => {
  it('clears cookie and returns ok', async () => {
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(createApp())
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });
});

describe('GET /api/auth/me', () => {
  it('returns user data when authenticated', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123', email: 'test@test.com', name: 'Test User'
    });

    const res = await request(createApp())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@test.com');
  });

  it('returns 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(createApp())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
  });
});
