# 🧠 Manuscript AI

Manuscript AI is an intelligent, AI-powered LaTeX resume editor designed to help you create, manage, and tailor your professional documents with ease. By integrating job scraping and advanced AI editing, it enables you to adapt your resume to specific job descriptions seamlessly.

---

## 🚀 Core Workflow

Paste Job URL → Scrape Job Details → AI Analyzes Keywords → Chat to Edit Resume → Compile to PDF → Download

---

## ✨ Features

-   **Intelligent LaTeX Editor**: High-performance Monaco-based editor with real-time preview and auto-compilation.
-   **AI-Powered Tailoring**: Leverage OpenAI (GPT-4o) to rewrite and optimize your resume content for specific job requirements.
-   **Job Scraper**: Automatically extract job details from platforms like LinkedIn, Indeed, Greenhouse, Lever, and Workday.
-   **Job Analysis**: Extract core skills and keywords to provide context for AI edits.
-   **Template Management**: Choose from professional LaTeX templates (like the standard JakeRyan template) or create your own.
-   **Live PDF Preview**: See your changes in real-time as you edit.
-   **Secure Authentication**: Built-in user management with JWT and session handling.
-   **Auto Save & History**: Track and manage multiple versions of your resumes.

---

## 🛠 Tech Stack

### Frontend
-   **Framework**: [React 19](https://reactjs.org/) with [Vite](https://vitejs.dev/)
-   **Language**: TypeScript
-   **Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
-   **Styling**: [TailwindCSS](https://tailwindcss.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **PDF Rendering**: [react-pdf](https://github.com/wojtekmaj/react-pdf)

### Backend
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
-   **AI Integration**: [OpenAI API](https://openai.com/)
-   **Authentication**: JWT & Bcrypt

### Scraper (Python)
-   **Language**: Python 3.x
-   **Tools**: BeautifulSoup, Playwright
-   **Capability**: Specialized scrapers for LinkedIn, Indeed, Greenhouse, Lever, and Workday.

---

## 📁 Project Structure

```text
manuscript-ai/
├── api/          # Serverless functions / API routes
├── backend/      # Express.js server and database services
├── frontend/     # React 19 / Vite application
├── scraper/      # Python scraping logic
└── templates/    # LaTeX .tex templates
```

---

## 🏁 Getting Started

### Prerequisites
-   Node.js (>= 18.0.0)
-   npm or yarn
-   PostgreSQL
-   Python 3.x (for scrapers)
-   A LaTeX distribution (e.g., TeX Live) installed on the server for compilation.

### Quick Start (Development)

1.  **Clone the repository**:
    ```bash
    git clone git@github.com:scar8969/Manuscript_AI.git
    cd Manuscript_AI
    ```

2.  **Install dependencies**:
    ```bash
    npm run install:all
    ```

3.  **Environment Setup**:
    Create `.env` files in both the root and `backend/` directories based on the provided `.env.example` files.
    ```bash
    cp .env.example .env
    cp backend/.env.example backend/.env # If available
    ```

4.  **Database Migration**:
    ```bash
    npm run db:push
    ```

5.  **Run the application**:
    ```bash
    npm run dev
    ```

The frontend will typically run on `http://localhost:5173` and the backend on `http://localhost:3000`.

---

## 🛣️ Roadmap

- Multi-template support
- Collaborative editing
- Automated cover letter generation
- ATS scoring and suggestions

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
