import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './lib/prisma';

function apiError(res: NextApiResponse, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

// GET / — List templates (public, with optional filters and pagination)
async function listTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, featured, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (featured !== undefined) {
      where.isFeatured = featured === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          isFeatured: true,
          isDefault: true,
          tags: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit
      }),
      prisma.template.count({ where })
    ]);

    res.json({
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to list templates');
  }
}

// GET /:id — Get single template by ID (public, includes latex)
async function getTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = req.query.id as string;
    const template = await prisma.template.findUnique({
      where: { id }
    });
    if (!template) return apiError(res, 404, 'TEMPLATE_NOT_FOUND', 'Template not found');
    res.json(template);
  } catch {
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get template');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id as string | undefined;
  const isIdRoute = id && id !== 'undefined';

  if (!isIdRoute && req.method === 'GET') return listTemplates(req, res);
  if (isIdRoute && req.method === 'GET') return getTemplate(req, res);

  return res.status(405).end();
}
