const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');
const { apiError } = require('../utils/errorHandler');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(docs);
  } catch (err) {
    console.error('[documents] List error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to list documents');
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { jobContexts: true }
    });
    if (!doc) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    res.json(doc);
  } catch (err) {
    console.error('[documents] Get error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to get document');
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, latex } = req.body;
    if (!latex) return apiError(res, 400, 'VALIDATION_ERROR', 'LaTeX code is required');

    const doc = await prisma.document.create({
      data: { userId: req.user.id, title: title || 'Untitled Resume', latex }
    });
    res.json(doc);
  } catch (err) {
    console.error('[documents] Create error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to create document');
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');

    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title !== undefined && { title: req.body.title }),
        ...(req.body.latex !== undefined && { latex: req.body.latex })
      }
    });
    res.json(doc);
  } catch (err) {
    console.error('[documents] Update error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to update document');
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return apiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document not found');

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[documents] Delete error:', err.message);
    apiError(res, 500, 'INTERNAL_ERROR', 'Failed to delete document');
  }
});

module.exports = router;
