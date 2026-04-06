import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../lib/prisma';
import { withAuth, AuthUser } from '../lib/auth';

function apiError(res: NextApiResponse, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

async function listDocs(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(docs);
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to list documents');
  }
}

async function createDoc(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const { title, latex } = req.body;
    if (!latex) return apiError(res, 400, 'VALIDATION_ERROR', 'LaTeX code is required');
    const doc = await prisma.document.create({
      data: { userId: user.userId, title: title || 'Untitled Resume', latex }
    });
    res.json(doc);
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to create document');
  }
}

async function getDoc(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.query.id as string, userId: user.userId },
      include: { jobContexts: true }
    });
    if (!doc) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    res.json(doc);
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get document');
  }
}

async function updateDoc(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const id = req.query.id as string;
    const existing = await prisma.document.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');

    const doc = await prisma.document.update({
      where: { id },
      data: {
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.latex && { latex: req.body.latex })
      }
    });
    res.json(doc);
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to update document');
  }
}

async function deleteDoc(req: NextApiRequest, res: NextApiResponse, user: AuthUser) {
  try {
    const id = req.query.id as string;
    const existing = await prisma.document.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');

    await prisma.document.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to delete document');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const isIdRoute = req.query.id && req.query.id !== 'undefined';

  if (!isIdRoute && req.method === 'GET') return withAuth(listDocs)(req, res);
  if (!isIdRoute && req.method === 'POST') return withAuth(createDoc)(req, res);
  if (isIdRoute && req.method === 'GET') return withAuth(getDoc)(req, res);
  if (isIdRoute && req.method === 'PUT') return withAuth(updateDoc)(req, res);
  if (isIdRoute && req.method === 'DELETE') return withAuth(deleteDoc)(req, res);

  return res.status(405).end();
}
