# 🧠 Manuscript AI

**Manuscript AI** is a browser-based LaTeX resume editor (like Overleaf) powered by AI.  
It helps job seekers tailor their resumes to specific job postings using automated scraping, keyword analysis, and LLM-driven editing — all in real time with a live PDF preview.

---

## 🚀 Core Workflow

Paste Job URL → Scrape Job Details → AI Analyzes Keywords → Chat to Edit Resume → Compile to PDF → Download

---

## ✨ Features

- 🧾 LaTeX Resume Editor (Monaco)
- 🤖 AI Resume Optimization (LLM-powered)
- 🔍 Job Scraper (LinkedIn, Indeed, etc.)
- 📊 Job Analysis (skills, keywords)
- 📄 Live PDF Preview
- 🔐 JWT Authentication
- 💾 Auto Save

---

## 🏗️ Tech Stack

Frontend: React, TypeScript, Vite, Zustand, Tailwind  
Backend: Node.js, Express, PostgreSQL, Prisma  
AI: OpenAI GPT-4o  
Scraper: Python (BeautifulSoup, Playwright)  
DevOps: Docker, Nginx, GitHub Actions  

---

## 📁 Project Structure

manuscript-ai/
├── frontend/
├── backend/
└── docker-compose.yml

---

## ⚙️ Getting Started

### Clone

git clone https://github.com/your-username/manuscript-ai.git
cd manuscript-ai

### Run (Docker)

docker-compose up --build

---

## 🔌 API

- /api/auth/*
- /api/documents/*
- /api/scrape
- /api/analyze
- /api/ai-edit
- /api/compile

---

## 🛣️ Roadmap

- Multi templates
- Collaboration
- Cover letters
- ATS scoring

---

## 📜 License

MIT License
