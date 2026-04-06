# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manuscript AI is an AI-powered LaTeX resume editor. Users paste a job URL, the scraper extracts job details, AI analyzes keywords, and users chat with AI to tailor their LaTeX resume, then compile to PDF. Dual deployment: Docker (Express + nginx) or Vercel (serverless).

## Common Commands

```bash
# Development (from repo root)
npm run dev                  # Frontend (port 5173) + Backend (port 3000)
npm run install:all          # Install deps for root, frontend, backend

# Frontend only
cd frontend && npm run dev        # Vite dev server
cd frontend && npm run build      # tsc -b && vite build
cd frontend && npm run lint       # ESLint
cd frontend && npm test           # Vitest (single run)
cd frontend && npm run test:watch # Vitest (watch mode)

# Backend only
cd backend && npm start           # Express server on port 3000

# Database (must run from backend/)
cd backend && npx prisma migrate dev
cd backend && npx prisma generate
cd backend && npx prisma db push

# Docker
docker-compose up

# CLI alternative
node cli.js setup     # Install deps + prisma generate
node cli.js dev       # Start dev servers
node cli.js migrate   # Run DB migrations
node cli.js build     # Build frontend
```

## Architecture

### Dual Backend Pattern

This project has two API implementations that serve the same endpoints. Changes to shared logic must be applied in both places:

- **`backend/`** — Express server (CommonJS), for Docker/self-hosted deployment
- **`api/`** — Vercel serverless functions (TypeScript, ESM), mirrors backend logic

| Feature | Backend (Express) | API (Vercel) |
|---------|-------------------|--------------|
| Auth | `backend/routes/auth.js` | `api/auth/[...route].ts` |
| Documents | `backend/routes/documents.js` | `api/documents/[id].ts` |
| AI edit | `backend/routes/aiEdit.js` | `api/ai-edit.ts` |
| Analyze | `backend/routes/analyze.js` | `api/analyze.ts` |
| AI logic | `backend/services/aiService.js` | `api/lib/ai.ts` |
| Compile | `backend/routes/compile.js` | `api/compile.ts` (proxies to self-hosted) |
| Scrape | `backend/routes/scrape.js` | `api/scrape.ts` (proxies to self-hosted) |

Compile and scrape require `pdflatex` and Python subprocess, so Vercel functions proxy those to `COMPILE_SERVICE_URL` / `SCRAPE_SERVICE_URL`.

### Module Systems

- `backend/` — CommonJS (`require`/`module.exports`)
- `frontend/` and `api/` — ESM (`import`/`export`)

### Request Flow

**Docker:** Browser → nginx (:80) → /api/* → Express (:3000) → services (pdflatex, OpenRouter, Python scraper, PostgreSQL)

**Vercel:** Browser → Vercel → api/*.ts → Prisma/AI directly, or proxy to self-hosted backend for compile/scrape

### Key Frontend Architecture

- **State:** Single Zustand store in `frontend/src/store/useStore.ts` (auth, editor, AI chat, compile, save, UI)
- **API client:** `frontend/src/services/api.ts` — Axios with JWT auto-refresh interceptor (catches 401, calls `/api/auth/refresh`, retries)
- **Auth:** Access token (15min JWT, Zustand memory only) + Refresh token (7-day JWT, httpOnly cookie)
- **Editor:** Monaco Editor (`@monaco-editor/react`) for LaTeX editing
- **Components:** `layout/` (TopNav, SideNav, LeftPanel, StatusBar), `editor/` (LatexEditor), `preview/` (PDFPreview), `ai/` (AIChat, JobContext), `ui/` (Button, Input, Logo)

### Python Scraper

`backend/scraper/` contains Python scrapers (requests + BeautifulSoup, Playwright for JS-rendered sites). Spawned as a subprocess from `backend/services/scraperService.js`, not imported. Supports generic, LinkedIn, Indeed, Greenhouse, Lever, Workday sites.

### AI Integration

Uses OpenRouter API (OpenAI-compatible SDK). Models configured in `backend/services/aiService.js`:
- Edit: `meta-llama/llama-3.1-8b-instruct:free` (temp 0.1)
- Analyze: `google/gemma-2-9b-it:free` (temp 0.3)

### Database

PostgreSQL via Prisma ORM. Schema in `backend/prisma/schema.prisma` with 4 models: User, Session, Document, JobContext.

## Environment Variables

See `.env.example` at repo root. Required: `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `OPENROUTER_API_KEY`. Frontend needs `VITE_API_BASE_URL` in `frontend/.env`.

## Design System

Spec in `stitch_manuscript/DESIGN.md`. Fonts: Noto Serif (content), Inter (UI). Icons: Material Symbols Outlined. Tailwind CSS 4 with custom design tokens.

## Error Response Format

All API errors use: `{ error: { code, message, details? } }`
