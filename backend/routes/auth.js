const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const { apiError } = require('../utils/errorHandler');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return apiError(res, 400, 'VALIDATION_ERROR', 'All fields required');
    if (!EMAIL_RE.test(email)) return apiError(res, 400, 'VALIDATION_ERROR', 'Invalid email format');
    if (password.length < MIN_PASSWORD_LEN) return apiError(res, 400, 'VALIDATION_ERROR', `Password must be at least ${MIN_PASSWORD_LEN} characters`);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError(res, 400, 'VALIDATION_ERROR', 'User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const user = await prisma.user.create({
      data: { id: userId, email, password: hashedPassword, name }
    });

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: 604800000
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err) {
    console.error('[auth] Register error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Registration failed');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return apiError(res, 400, 'VALIDATION_ERROR', 'Email and password required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return apiError(res, 401, 'INVALID_TOKEN', 'Invalid credentials');
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: 604800000
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err) {
    console.error('[auth] Login error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Login failed');
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return apiError(res, 401, 'INVALID_TOKEN', 'No refresh token');

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.session.findFirst({
      where: { token: hashedToken, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!session) return apiError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');

    const accessToken = jwt.sign({ userId: session.user.id, email: session.user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ userId: session.user.id, email: session.user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    const hashedNewRefresh = crypto.createHash('sha256').update(newRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.update({
      where: { id: session.id },
      data: { token: hashedNewRefresh, expiresAt }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      maxAge: 604800000
    });
    res.json({ accessToken });
  } catch (err) {
    console.error('[auth] Refresh error:', err.message);
    apiError(res, 401, 'INVALID_TOKEN', 'Invalid token');
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.session.deleteMany({ where: { token: hashedToken } }).catch(() => {});
  }
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return apiError(res, 404, 'INVALID_TOKEN', 'User not found');
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('[auth] Me error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get user');
  }
});

module.exports = router;
