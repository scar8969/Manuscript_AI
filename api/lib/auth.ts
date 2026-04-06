import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

export interface AuthUser {
  userId: string;
  email: string;
}

export function verifyToken(req: NextApiRequest): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.ACCESS_TOKEN_SECRET!
    ) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export type Handler = (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => Promise<void> | void;

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Access token is invalid or expired' }
      });
    }
    return handler(req, res, user);
  };
}
