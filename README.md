# 🧠 Manuscript AI

> An AI-powered LaTeX resume editor that scrapes job descriptions and tailors your resume to match.

Manuscript AI combines a high-performance Monaco-based LaTeX editor with job scraping and AI-driven rewriting, so you can adapt your resume to any job description and compile to PDF in minutes.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🚀 Core Workflow

```
Paste Job URL → Scrape Job Details → AI Analyzes Keywords → Chat to Edit Resume → Compile to PDF → Download
```

## ✨ Features

- **Intelligent LaTeX Editor** – high-performance Monaco-based editor with real-time preview and auto-compilation
- **AI-Powered Tailoring** – OpenAI (GPT-4o) rewrites and optimizes resume content for specific job requirements
- **Job Scraper** – extracts job details from LinkedIn, Indeed, Greenhouse, Lever, and Workday
- **Job Analysis** – extracts core skills and keywords to guide AI edits
- **Template Management** – professional LaTeX templates or your own
- **Live PDF Preview** – see changes in real-time
- **Secure Authentication** – JWT + session-based user management
- **Auto Save & History** – track and manage multiple resume versions

## 🛠 Tech Stack

**Frontend**
- React 19 · Vite · TypeScript
- @monaco-editor/react · TailwindCSS · Zustand · react-pdf

**Backend**
- Node.js · Express.js · PostgreSQL + Prisma ORM
- OpenAI API · JWT & Bcrypt auth

**Scraper (Python)**
- BeautifulSoup · Playwright
- Specialized scrapers for LinkedIn, Indeed, Greenhouse, Lever, and Workday

## 📁 Project Structure

```
Manuscript_AI/
├── frontend/     # React 19 / Vite application
├── backend/      # Express.js server, Prisma, and scrapers
├── api/          # Serverless functions / API routes
├── templates/    # LaTeX .tex templates
└── cli.js        # CLI entry point
```

## 🏁 Getting Started

### Prerequisites
- Node.js ≥ 18.0.0 · PostgreSQL · Python 3.x (scrapers)
- A LaTeX distribution (e.g. TeX Live) for PDF compilation

### Quick Start

```bash
git clone git@github.com:scar8969/Manuscript_AI.git
cd Manuscript_AI

# Install all dependencies
npm run install:all

# Environment setup (root + backend/)
cp .env.example .env
cp backend/.env.example backend/.env   # if available

# Database migration
npm run db:push

# Run the app
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

## 🛣 Roadmap

- Multi-template support
- Collaborative editing
- Automated cover letter generation
- ATS scoring and suggestions

## 📄 License

This project is licensed under the [MIT License](LICENSE).