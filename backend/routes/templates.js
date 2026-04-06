const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const prisma = require('../prisma');
const { apiError } = require('../utils/errorHandler');

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

// GET /local — List .tex files from the templates/ directory
router.get('/local', (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      return res.json({ data: [] });
    }
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.tex'));
    const templates = files.map(filename => {
      const name = path.basename(filename, '.tex');
      const filePath = path.join(TEMPLATES_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        id: name,
        name,
        filename,
        category: 'resume',
        description: null,
        isFeatured: false,
        isDefault: name === 'default',
        tags: [],
        sortOrder: 0,
        createdAt: stats.mtime.toISOString(),
        updatedAt: stats.mtime.toISOString()
      };
    });
    res.json({ data: templates });
  } catch (err) {
    console.error('[templates] Local list error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to list local templates');
  }
});

// GET /local/:name — Read a .tex file from the templates/ directory
router.get('/local/:name', (req, res) => {
  try {
    const name = req.params.name;
    const filePath = path.join(TEMPLATES_DIR, `${name}.tex`);
    if (!fs.existsSync(filePath)) {
      return apiError(res, 404, 'TEMPLATE_NOT_FOUND', 'Template not found');
    }
    const latex = fs.readFileSync(filePath, 'utf8');
    res.json({
      id: name,
      name,
      filename: `${name}.tex`,
      latex,
      category: 'resume',
      description: null,
      isFeatured: false,
      isDefault: name === 'default',
      tags: [],
      sortOrder: 0
    });
  } catch (err) {
    console.error('[templates] Local get error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to read template');
  }
});

// GET / — List templates (public, with optional filters and pagination)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      featured,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (featured !== undefined) {
      where.isFeatured = featured === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

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
        take: limitNum
      }),
      prisma.template.count({ where })
    ]);

    res.json({
      data: templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[templates] List error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to list templates');
  }
});

// GET /:id — Get single template by ID (public, includes latex)
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });
    if (!template) return apiError(res, 404, 'TEMPLATE_NOT_FOUND', 'Template not found');
    res.json(template);
  } catch (err) {
    console.error('[templates] Get error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get template');
  }
});

module.exports = router;
