import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { withAuth, AuthUser } from '../lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function apiError(res: NextApiResponse, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

async function register(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return apiError(res, 400, 'VALIDATION_ERROR', 'All fields required');
    if (!EMAIL_RE.test(email)) return apiError(res, 400, 'VALIDATION_ERROR', 'Invalid email');
    if (password.length < 8) return apiError(res, 400, 'VALIDATION_ERROR', 'Password must be at least 8 characters');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError(res, 400, 'VALIDATION_ERROR', 'User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt: new Date(Date.now() + 7 * 86400000) }
    });

    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400000}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err: any) {
    apiError(res, 500, 'INTERNAL_ERROR', 'Registration failed');
  }
}

async function login(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return apiError(res, 400, 'VALIDATION_ERROR', 'Email and password required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return apiError(res, 401, 'INVALID_TOKEN', 'Invalid credentials');
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.session.create({
      data: { userId: user.id, token: hashedRefresh, expiresAt: new Date(Date.now() + 7 * 86400000) }
    });

    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400000}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err: any) {
    apiError(res, 500, 'INTERNAL_ERROR', 'Login failed');
  }
}

async function refresh(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.refreshToken;
  if (!token) return apiError(res, 401, 'INVALID_TOKEN', 'No refresh token');

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.session.findFirst({
      where: { token: hashedToken, expiresAt: { gt: new Date() } },
      include: { user: true }
    });
    if (!session) return apiError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');

    const accessToken = jwt.sign({ userId: session.user.id, email: session.user.email }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ userId: session.user.id, email: session.user.email }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });

    const hashedNew = crypto.createHash('sha256').update(newRefresh).digest('hex');
    await prisma.session.update({
      where: { id: session.id },
      data: { token: hashedNew, expiresAt: new Date(Date.now() + 7 * 86400000) }
    });

    res.setHeader('Set-Cookie', `refreshToken=${newRefresh}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400000}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
    res.json({ accessToken });
  } catch (err: any) {
    apiError(res, 401, 'INVALID_TOKEN', 'Invalid token');
  }
}

async function logout(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.refreshToken;
  if (token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.session.deleteMany({ where: { token: hashed } }).catch(() => {});
  }
  res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
}

async function me(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const u = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!u) return apiError(res, 404, 'INVALID_TOKEN', 'User not found');
    res.json({ user: { id: u.id, email: u.email, name: u.name } });
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get user');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { route } = req.query;
  const path = Array.isArray(route) ? route[0] : route;

  switch (path) {
    case 'register':
      if (req.method !== 'POST') return res.status(405).end();
      return register(req, res);
    case 'login':
      if (req.method !== 'POST') return res.status(405).end();
      return login(req, res);
    case 'refresh':
      if (req.method !== 'POST') return res.status(405).end();
      return refresh(req, res);
    case 'logout':
      if (req.method !== 'POST') return res.status(405).end();
      return logout(req, res);
    case 'me':
      if (req.method !== 'GET') return res.status(405).end();
      return withAuth(me)(req, res);
    default:
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  }
}
