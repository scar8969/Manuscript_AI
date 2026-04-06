Contents
1. Project overview
2. Tech stack
3. System architecture
4. File & folder structure
5. Database schema
6. All API endpoints
7. All workflows
8. Frontend components
9. State management
10. Backend services
11. Python scraper
12. AI / LLM layer
13. Auth system
14. Environment variables
15. Error handling
16. Design system
17. Deployment
18. Build order
1. Project overview
What this is
Manuscript AI — a browser-based LaTeX resume editor (like Overleaf) combined with a job posting scraper and an LLM chatbot. The user pastes a job URL, the scraper extracts the job details, the AI analyzes it for keywords and skills, then the user chats with the AI to tailor their LaTeX resume to the job. The result compiles to a downloadable PDF in real time.
Core value loop
Paste job URL
→
Scrape job details
→
AI analyzes keywords
→
Chat to edit resume
→
Compile to PDF
→
Download
Target user
Job seekers who want to quickly tailor a LaTeX resume to a specific job posting without manually rewriting bullet points
Key differentiator
Unlike Overleaf, it reads the job posting and knows which parts of your resume to improve. Unlike a plain chatbot, it outputs a compiled PDF.
2. Tech stack
Frontend
React 19 TypeScript Vite Zustand Monaco Editor Tailwind CSS 4
Backend
Node.js 18+ Express Python 3.8+ pdflatex
AI / LLM
OpenAI GPT-4o openai npm SDK
Storage & auth (to build)
PostgreSQL Prisma ORM JWT (access + refresh) bcrypt
Python scraper deps
requests BeautifulSoup4 lxml playwright (for JS sites)
DevOps / deployment
Docker docker-compose nginx GitHub Actions
3. System architecture
High-level layers
Browser (React SPA)
    ↕ REST + JSON
Express API Server (Node.js :3000)
    ├── LaTeX Service  → pdflatex binary → temp/*.pdf
    ├── AI Service     → OpenAI API (GPT-4o)
    ├── Scraper Bridge → spawns Python process
    └── Auth Service   → PostgreSQL via Prisma

Python Scraper (subprocess, stdout → JSON)
    ├── Generic scraper (BeautifulSoup)
    ├── LinkedIn scraper (Playwright)
    ├── Indeed scraper
    └── Greenhouse / Lever scrapers

PostgreSQL Database
    ├── users
    ├── documents
    ├── job_contexts
    └── sessions
Request routing overview
Layer	Handles	Talks to
TopNav / SideNav	Navigation, auth UI	Auth store
LeftPanel	Job input + AI chat	/api/scrape /api/analyze /api/ai-edit
LatexEditor	Monaco code editing	Zustand store
PDFPreview	Render compiled PDF	/api/compile
Express routes	Validate + route all calls	Services layer
Services	Business logic	pdflatex, OpenAI, Python, DB
4. File & folder structure
Frontend
frontend/ ├── src/ │ ├── components/ │ │ ├── layout/ │ │ │ ├── TopNav.tsx │ │ │ ├── SideNav.tsx │ │ │ ├── LeftPanel.tsx │ │ │ └── StatusBar.tsx │ │ ├── editor/ │ │ │ └── LatexEditor.tsx │ │ ├── preview/ │ │ │ └── PDFPreview.tsx │ │ ├── ai/ │ │ │ ├── AIChat.tsx │ │ │ └── JobContext.tsx │ │ └── ui/ │ │ ├── Button.tsx │ │ └── Input.tsx │ ├── store/ │ │ └── useStore.ts ← Zustand │ ├── services/ │ │ └── api.ts │ ├── hooks/ │ │ ├── useCompile.ts │ │ └── useAutoSave.ts │ ├── types/ │ │ └── index.ts │ ├── App.tsx │ └── main.tsx ├── index.html ├── vite.config.ts └── tailwind.config.ts
Backend
backend/ ├── server.js ← entry point ├── routes/ │ ├── auth.js │ ├── compile.js │ ├── aiEdit.js │ ├── scrape.js │ ├── analyze.js │ └── documents.js ├── services/ │ ├── latexService.js │ ├── aiService.js │ ├── scraperService.js │ └── authService.js ├── middleware/ │ ├── auth.js ← JWT verify │ ├── rateLimit.js │ └── validate.js ├── utils/ │ ├── fileManager.js │ └── errorHandler.js ├── prisma/ │ └── schema.prisma ├── scraper/ │ ├── main.py │ ├── base_scraper.py │ ├── generic_scraper.py │ ├── linkedin_scraper.py │ ├── indeed_scraper.py │ ├── greenhouse_scraper.py │ └── utils.py ├── temp/ ← compiled PDFs (gitignored) └── .env
5. Database schema
Using PostgreSQL + Prisma ORM. Run prisma migrate dev to apply.
-- users
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
email       TEXT UNIQUE NOT NULL
password    TEXT NOT NULL  -- bcrypt hash
name        TEXT
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP

-- sessions (refresh tokens)
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
token       TEXT UNIQUE NOT NULL  -- hashed refresh token
expires_at  TIMESTAMP NOT NULL
created_at  TIMESTAMP DEFAULT NOW()

-- documents (saved LaTeX resumes)
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
title       TEXT NOT NULL DEFAULT 'Untitled Resume'
latex       TEXT NOT NULL  -- full LaTeX source
updated_at  TIMESTAMP DEFAULT NOW()
created_at  TIMESTAMP DEFAULT NOW()

-- job_contexts (scraped jobs linked to a document)
id              UUID PRIMARY KEY
document_id     UUID REFERENCES documents(id) ON DELETE CASCADE
url             TEXT
title           TEXT
company         TEXT
location        TEXT
description     TEXT
salary          TEXT
job_type        TEXT
analysis        JSONB  -- { keywords, requiredSkills, ... }
scraped_at      TIMESTAMP DEFAULT NOW()
6. All API endpoints
Auth routes — /api/auth
Method + Path	Input	Output	Notes
POST /api/auth/register	{ email, password, name }	{ user, accessToken } + refresh cookie	bcrypt hash pw, issue JWT pair
POST /api/auth/login	{ email, password }	{ user, accessToken } + refresh cookie	Verify bcrypt, issue JWT pair
POST /api/auth/refresh	Refresh token (httpOnly cookie)	{ accessToken }	Rotate refresh token
POST /api/auth/logout	Refresh token cookie	{ ok }	Delete session row, clear cookie
GET /api/auth/me	Bearer token	{ user }	Requires auth middleware
Document routes — /api/documents
Method + Path	Input	Output	Notes
GET /api/documents	—	Array of user's documents	Auth required
GET /api/documents/:id	—	Single document + job_context	Auth + ownership check
POST /api/documents	{ title, latex }	Created document	Auth required
PUT /api/documents/:id	{ title?, latex? }	Updated document	Auto-save calls this
DELETE /api/documents/:id	—	{ ok }	Auth + ownership
Core feature routes
Method + Path	Input	Output	Notes
POST /api/compile	{ latex: string }	PDF blob (application/pdf)	Max 1MB LaTeX, runs pdflatex
POST /api/ai-edit	{ latex, prompt, jobDescription? }	{ updated_latex }	GPT-4o, temp 0.1
POST /api/scrape	{ url: string }	{ job, company, source_website, scraped_at }	Spawns Python scraper
POST /api/analyze	{ jobDescription: string }	{ keywords, requiredSkills, ... }	GPT-4o, temp 0.3
GET /api/health	—	{ ok, version }	Docker health check
All response error codes
Code	Meaning	When
400	Bad request	Missing required fields, input too large
401	Unauthorized	Missing/invalid JWT access token
403	Forbidden	Authenticated but wrong user for resource
404	Not found	Document / resource doesn't exist
422	Unprocessable	LaTeX compilation failed (returns log)
429	Rate limited	Too many requests from same IP
500	Server error	Unexpected crash, OpenAI failure
7. All workflows
Workflow A — new user onboarding
1
Land on homepage
User sees marketing page or is redirected to /editor with default LaTeX template loaded
2
Register
POST /api/auth/register → server creates user row, issues access token (15min JWT) + refresh token (7d httpOnly cookie), stores hashed refresh in sessions table
3
Default document created
On first login, POST /api/documents with default LaTeX template. Document ID stored in Zustand + URL params.
4
Editor opens
Monaco loads LaTeX. PDF auto-compiles on first load and shows in preview panel.
Workflow B — job scraping
1
User pastes job URL
Into the URL input field in JobContext component. Clicks "Scrape" button.
2
Frontend calls POST /api/scrape
Sends { url }. Shows loading spinner.
3
Express spawns Python scraper
scraperService.js calls child_process.spawn('python3', ['scraper/main.py', url]). main.py detects site (LinkedIn/Indeed/Greenhouse/generic), routes to correct scraper class, returns JSON via stdout.
4
Job data returned to frontend
JobContext store updated with job title, company, description. Description textarea auto-filled. Tab switches to show job details.
5
Job context saved to DB
If user is authenticated, POST /api/documents/:id saves the job_context row linked to the open document.
Workflow C — job analysis
1
User clicks "Analyze"
Either after scraping, or after manually pasting job description into the textarea.
2
POST /api/analyze
Sends full job description text. aiService.analyzeJob() sends to GPT-4o with structured JSON extraction prompt.
3
Analysis displayed
JobContext switches to Analysis tab showing: keyword chips, required skills (red), preferred skills (amber), experience level, industry, responsibilities checklist, suggested resume sections.
4
Analysis stored in Zustand
Analysis object stored in store. All subsequent AI chat calls automatically receive this context as part of the system prompt.
Workflow D — AI resume editing
1
User types message in AIChat
e.g. "Make my bullet points more impact-focused and include the keywords Python and Kubernetes"
2
POST /api/ai-edit
Sends { latex: currentLatex, prompt: userMessage, jobDescription: analysis.description }
3
GPT-4o edits LaTeX
System prompt instructs it: only modify text content in resumeItem/resumeSubheading, never touch LaTeX commands or structure, tailor to job keywords if provided. Temperature 0.1 for consistency.
4
Updated LaTeX applied
Monaco editor content replaced with updated_latex. Chat message logged. Auto-compile triggered.
5
Auto-save fires
useAutoSave hook detects latex change, debounces 2s, calls PUT /api/documents/:id to persist.
Workflow E — compile & preview
1
Trigger
User clicks "Preview" or "Download" button, or auto-compile fires after AI edit
2
POST /api/compile
Sends { latex }. Shows compiling spinner in StatusBar.
3
latexService runs pdflatex
Saves .tex to temp/[uuid].tex, runs pdflatex -interaction=nonstopmode, reads resulting .pdf, returns as binary blob.
4
PDF rendered in preview
Frontend creates object URL from blob, injects into iframe. Zoom, page nav, fullscreen controls active.
5
Temp cleanup
cleanupOldFiles() runs on setInterval every 30min, deletes .tex/.pdf files older than 1 hour.
Workflow F — auto-save
1
User edits in Monaco
onChange fires on every keystroke, updates Zustand latexCode
2
useAutoSave detects change
Watches latexCode in store. Debounces 2000ms. Only fires if user is authenticated and document ID exists.
3
PUT /api/documents/:id
Sends updated latex. StatusBar shows "Saving..." then "Saved" or error.
Workflow G — JWT auth & token refresh
1
Access token expires (15min)
API returns 401. Axios interceptor in api.ts catches it.
2
Auto-refresh
Interceptor calls POST /api/auth/refresh with httpOnly refresh cookie. New access token returned and stored in memory (never localStorage).
3
Original request retried
Failed request queued and retried with new token. Transparent to user.
4
Refresh token expired
User redirected to login. All in-memory tokens cleared.
8. Frontend components
Component	File	Responsibility	Store slices used
TopNav	layout/TopNav.tsx	Brand, nav links, sign in/out, user avatar	auth
SideNav	layout/SideNav.tsx	Icon sidebar, tab switching (editor/ai/structure/templates)	ui.activeTab
LeftPanel	layout/LeftPanel.tsx	Container: JobContext (top) + AIChat (bottom)	—
StatusBar	layout/StatusBar.tsx	Compile status, save status, cursor position, engine	compileStatus, saveStatus, cursorPosition
LatexEditor	editor/LatexEditor.tsx	Monaco editor, compile/download buttons, keybindings	latexCode, compileStatus
PDFPreview	preview/PDFPreview.tsx	Iframe PDF render, zoom, fullscreen, page nav, thumbnail sidebar	pdfUrl, zoom
AIChat	ai/AIChat.tsx	Chat UI, message history, sends to /api/ai-edit	messages, latexCode, jobContext
JobContext	ai/JobContext.tsx	URL input, scrape button, description textarea, analysis tab	jobContext, analysis, analysisStatus
Button	ui/Button.tsx	Reusable button, variants: primary/secondary/tertiary	—
Input	ui/Input.tsx	Reusable text input with label + validation	—
9. State management (Zustand)
Full store shape — src/store/useStore.ts
interface AppStore {
  // Auth
  user: User | null
  accessToken: string | null
  setAuth: (user, token) => void
  clearAuth: () => void

  // Active document
  documentId: string | null
  documentTitle: string
  setDocument: (id, title) => void

  // Editor
  latexCode: string
  setLatexCode: (code: string) => void
  isDirty: boolean  // unsaved changes flag

  // Job context
  jobContext: {
    url: string
    description: string
    title: string
    company: string
  }
  setJobContext: (ctx) => void

  // Analysis
  analysis: JobAnalysis | null
  setAnalysis: (a) => void
  analysisStatus: 'idle' | 'analyzing' | 'success' | 'error'
  setAnalysisStatus: (s) => void

  // AI chat
  messages: Message[]
  addMessage: (m: Message) => void
  clearMessages: () => void

  // Compilation
  compileStatus: 'idle' | 'compiling' | 'success' | 'error'
  compileError: string | null
  setCompileStatus: (s, err?) => void

  // PDF
  pdfUrl: string | null
  setPdfUrl: (url) => void

  // Preview
  zoom: number
  setZoom: (z: number) => void
  viewMode: 'single' | 'spread' | 'side-by-side'
  setViewMode: (m) => void

  // Save
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  setSaveStatus: (s) => void

  // UI
  cursorPosition: { line: number; column: number }
  setCursorPosition: (p) => void
}
10. Backend services
latexService.js
Generates unique filename (timestamp + random hex). Saves .tex to temp/. Runs pdflatex -interaction=nonstopmode -output-directory=temp/ temp/[name].tex. On success: reads .pdf, returns binary. On failure: parses log for error line, throws LATEX_ERROR with structured message.
aiService.js
Two functions:
editLatex(latex, prompt, jobDescription?)
  → model: gpt-4o
  → temperature: 0.1
  → max_tokens: 16000
  → system: "You are a LaTeX resume editor. You ONLY modify text
    content inside resumeItem and resumeSubheading commands.
    Never modify LaTeX commands, structure, or formatting.
    Never invent new content. If job description provided,
    tailor existing content to match its keywords."
  → returns: updated_latex string

analyzeJob(jobDescription)
  → model: gpt-4o
  → temperature: 0.3
  → max_tokens: 4000
  → system: "Extract structured data from job posting. Return ONLY
    valid JSON with keys: keywords[], requiredSkills[],
    preferredSkills[], experienceLevel, keyResponsibilities[],
    qualifications[], industry, suggestedResumeSections[]"
  → returns: parsed JSON object
scraperService.js
Spawns Python subprocess with URL arg. Collects stdout. Parses JSON. Handles stderr for Python errors. 30 second timeout kills process.
authService.js
register(), login(), refresh(), logout(). Issues access JWT (15min, signed with ACCESS_TOKEN_SECRET). Issues refresh token (7 days, stored hashed in sessions table, sent as httpOnly Secure SameSite=Strict cookie).
11. Python scraper
Site detection logic — main.py
url → detect domain:
  linkedin.com/jobs  → LinkedInScraper
  indeed.com         → IndeedScraper
  greenhouse.io      → GreenhouseScraper
  lever.co           → LeverScraper
  workday.com        → WorkdayScraper (Playwright)
  default            → GenericScraper
Output schema (stdout JSON)
{
  "job": {
    "title": string,
    "company": string,
    "location": string,
    "description": string,  // full text, cleaned
    "salary": string | null,
    "job_type": "full-time" | "part-time" | "contract" | null,
    "posted_date": string | null,
    "application_url": string
  },
  "company": {
    "name": string,
    "description": string | null,
    "size": string | null,
    "website": string | null,
    "industry": string | null,
    "logo_url": string | null,
    "headquarters": string | null
  },
  "source_website": string,
  "scraped_at": ISO8601 string
}
Scraper strategy per site
Site	Method	Key selectors
LinkedIn	Playwright (JS-rendered)	.job-details-jobs-unified-top-card, .jobs-description
Indeed	requests + BS4	#jobDescriptionText, .jobsearch-JobInfoHeader
Greenhouse	requests + BS4	#content, .app-title
Lever	requests + BS4	.posting-headline, .section-wrapper
Generic	requests + BS4 heuristics	Looks for largest text block, common job-related patterns
12. AI / LLM layer
System prompt for /api/ai-edit (full)
You are a professional resume editor specializing in LaTeX resumes.

RULES — you must follow all of these without exception:
1. Only modify text content inside \resumeItem{} and \resumeSubheading{} commands
2. Never add, remove, or change any LaTeX commands, packages, or structure
3. Never invent experience, skills, dates, or roles that aren't already there
4. Preserve all whitespace and formatting exactly as-is outside of text content
5. Return ONLY the complete updated LaTeX document, no explanation

When a job description is provided:
- Identify keywords and skills from the job description
- Rephrase existing bullet points to naturally include those keywords
- Prioritize quantifiable impact statements (numbers, percentages, scale)
- Match the seniority and tone of the job posting
System prompt for /api/analyze (full)
You are a job description analyzer. Extract structured information.
Return ONLY valid JSON, no markdown, no explanation.

Schema:
{
  "keywords": string[],           // top 10-15 important terms
  "requiredSkills": string[],     // explicitly required
  "preferredSkills": string[],    // nice to have / preferred
  "experienceLevel": "entry" | "mid" | "senior" | "executive",
  "keyResponsibilities": string[], // top 5-7 bullet points
  "qualifications": string[],     // education/cert requirements
  "industry": string,
  "suggestedResumeSections": string[] // e.g. ["Projects", "Certifications"]
}
13. Auth system
Token strategy
Token	TTL	Storage	Used for
Access JWT	15 minutes	Memory only (Zustand)	All authenticated API calls
Refresh token	7 days	httpOnly Secure cookie + hashed in DB	Issuing new access tokens silently
Auth middleware — middleware/auth.js
1. Extract Bearer token from Authorization header
2. Verify with jwt.verify(token, ACCESS_TOKEN_SECRET)
3. Attach decoded { userId, email } to req.user
4. Call next() or return 401
Never store access tokens in localStorage or sessionStorage. Memory-only prevents XSS token theft. Refresh tokens are httpOnly so JS cannot read them.
14. Environment variables
backend/.env
PORT=3000
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
ACCESS_TOKEN_SECRET=long_random_string_here
REFRESH_TOKEN_SECRET=different_long_random_string

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/manuscript_ai

# Limits
MAX_INPUT_SIZE=1000000
TEMP_DIR=./temp
CLEANUP_INTERVAL_MS=1800000   # 30 min
TEMP_MAX_AGE_MS=3600000       # 1 hour

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 min
RATE_LIMIT_MAX=100            # per window
frontend/.env
VITE_API_BASE_URL=http://localhost:3000
15. Error handling
Standard API error shape
{
  "error": {
    "code": "LATEX_COMPILATION_ERROR",
    "message": "Human-readable message",
    "details": { "line": 42, "log": "..." }  // optional
  }
}
Error codes
Code	HTTP	Cause
LATEX_COMPILATION_ERROR	422	pdflatex returned non-zero exit
LATEX_TOO_LARGE	400	LaTeX input exceeds MAX_INPUT_SIZE
SCRAPE_FAILED	502	Python scraper returned error or timed out
AI_ERROR	502	OpenAI API call failed
INVALID_TOKEN	401	JWT verify failed
DOCUMENT_NOT_FOUND	404	Document ID doesn't exist or wrong user
VALIDATION_ERROR	400	Missing required fields in request body
16. Design system
Philosophy: "Editorial Authority"
Bridges LaTeX precision with modern SaaS. Intentional asymmetry, massive typographic contrast, paper-on-slate layering. Noto Serif for content, Inter for UI.
Token	Hex	Usage
primary	#000000	Typography, primary CTAs
primary_container	#111c2d	Sidebar, user chat messages
surface	#f7f9fb	Page background
surface_container_lowest	#ffffff	Document / paper surface
secondary_container	#d0e1fb	Secondary buttons
error	#ba1a1a	Errors and destructive actions
17. Deployment
Docker compose services
services:
  frontend:   React SPA → nginx static serve → :80
  backend:    Node.js Express → :3000
              (includes pdflatex + Python in same image)
  db:         postgres:15-alpine → :5432
  nginx:      reverse proxy → frontend :80, /api → backend :3000
Dockerfile — backend (multi-stage)
FROM node:18-alpine
RUN apk add --no-cache texlive python3 py3-pip
RUN pip3 install requests beautifulsoup4 lxml playwright
RUN playwright install chromium --with-deps
WORKDIR /app
COPY package*.json .
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
18. Recommended build order
Phase 1
Project scaffold: monorepo structure, ESLint, Prettier, Prisma init, env files, Docker skeleton
Phase 2
Database + auth: Prisma schema, migrations, /api/auth routes, JWT middleware, login/register UI
Phase 3
Core editor: Monaco integration, LaTeX service, /api/compile, PDF preview, auto-save hook + /api/documents CRUD
Phase 4
Scraper: Python base class, generic scraper, /api/scrape, JobContext component, site-specific scrapers
Phase 5
AI layer: /api/analyze, /api/ai-edit, AIChat component, job analysis display, keyword chips
Phase 6
Polish: rate limiting, error UI (LaTeX line numbers), dark mode, multi-page PDF, cleanup cron
Phase 7
Deploy: Dockerfile, docker-compose, nginx config, GitHub Actions CI/CD, env secrets