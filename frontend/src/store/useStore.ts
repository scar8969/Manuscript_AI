import { create } from 'zustand';
import type { User, JobContext, JobAnalysis, Message, Template } from '../types';

type MobileTab = 'context' | 'editor' | 'preview' | 'templates';
type DesktopLeftView = 'default' | 'templates';

interface AppStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User | null, token: string) => void;
  clearAuth: () => void;

  documentId: string | null;
  documentTitle: string;
  setDocument: (id: string, title: string) => void;
  setDocumentTitle: (title: string) => void;

  latexCode: string;
  setLatexCode: (code: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;

  jobContext: JobContext;
  setJobContext: (ctx: Partial<JobContext>) => void;

  analysis: JobAnalysis | null;
  setAnalysis: (a: JobAnalysis | null) => void;
  analysisStatus: 'idle' | 'analyzing' | 'success' | 'error';
  setAnalysisStatus: (s: 'idle' | 'analyzing' | 'success' | 'error') => void;

  messages: Message[];
  addMessage: (m: Message) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updates: Partial<import('../types').Message>) => void;

  compileStatus: 'idle' | 'compiling' | 'success' | 'error';
  compileError: string | null;
  setCompileStatus: (s: 'idle' | 'compiling' | 'success' | 'error', err?: string) => void;

  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;

  zoom: number;
  setZoom: (z: number) => void;
  viewMode: 'single' | 'spread' | 'side-by-side';
  setViewMode: (m: 'single' | 'spread' | 'side-by-side') => void;

  pdfPageCount: number;
  setPdfPageCount: (n: number) => void;

  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setSaveStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;

  cursorPosition: { line: number; column: number };
  setCursorPosition: (p: { line: number; column: number }) => void;

  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // Mobile
  activeMobileTab: MobileTab;
  setActiveMobileTab: (tab: MobileTab) => void;

  // Desktop left panel view
  activeDesktopLeftView: DesktopLeftView;
  setActiveDesktopLeftView: (view: DesktopLeftView) => void;

  // Templates
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  templateLoading: boolean;
  setTemplateLoading: (loading: boolean) => void;
  applyingTemplateId: string | null;
  setApplyingTemplateId: (id: string | null) => void;
}

let msgCounter = 0;

const DEFAULT_LATEX = `\\documentclass[11pt]{article}
\\usepackage[left=0.75in,top=0.6in,right=0.75in,bottom=0.6in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\hypersetup{colorlinks=true, linkcolor=black, filecolor=black, urlcolor=blue}

\\titleformat{\\section}{\\bfseries\\uppercase}{}{0em}{}
\\titleformat{\\subsection}{\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{0.5em}{0.3em}

\\newcommand{\\resumeItem}[1]{\\item #1 \\vspace{-4pt}}
\\newcommand{\\resumeSubheading}[4]{
  \\begin{itemize}
  \\item[]
  \\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4
  \\end{itemize}
}
\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}}

\\begin{document}

\\section{Name}
Your Name
\\href{email@example.com}{email@example.com} | (555) 123-4567 | github.com/yourname

\\section{Summary}
Experienced software engineer with expertise in full-stack development and cloud technologies.

\\section{Experience}
\\resumeSubheading{Software Engineer}{Jan 2020 - Present}{Tech Company}{San Francisco, CA}
\\begin{itemize}
\\resumeItem{Developed and maintained microservices serving 1M+ users}
\\resumeItem{Implemented CI/CD pipelines reducing deployment time by 40\\%}
\\resumeItem{Led team of 5 engineers on key product initiatives}
\\end{itemize}

\\section{Education}
\\resumeSubheading{University Name}{2016 - 2020}{Bachelor of Science in Computer Science}{GPA: 3.8}

\\section{Skills}
\\begin{itemize}
\\resumeItem{Programming: Python, JavaScript, TypeScript, Go}
\\resumeItem{Frameworks: React, Node.js, Express}
\\resumeItem{Cloud: AWS, GCP, Docker, Kubernetes}
\\resumeItem{Tools: Git, CI/CD, PostgreSQL, MongoDB}
\\end{itemize}

\\end{document}`;

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token) => set({ user, accessToken: token }),
  clearAuth: () => set({ user: null, accessToken: null }),

  documentId: null,
  documentTitle: 'Untitled Resume',
  setDocument: (id, title) => set({ documentId: id, documentTitle: title }),
  setDocumentTitle: (title) => set({ documentTitle: title }),

  latexCode: DEFAULT_LATEX,
  setLatexCode: (code) => set({ latexCode: code, isDirty: true }),
  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  jobContext: { url: '', description: '', title: '', company: '' },
  setJobContext: (ctx) => set((state) => ({ jobContext: { ...state.jobContext, ...ctx } })),

  analysis: null,
  setAnalysis: (a) => set({ analysis: a }),
  analysisStatus: 'idle',
  setAnalysisStatus: (s) => set({ analysisStatus: s }),

  messages: [],
  addMessage: (m) => set((state) => ({ messages: [...state.messages, { ...m, id: m.id || `msg-${++msgCounter}` }] })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m))
  })),
  clearMessages: () => set({ messages: [] }),

  compileStatus: 'idle',
  compileError: null,
  setCompileStatus: (s, err) => set({ compileStatus: s, compileError: err || null }),

  pdfUrl: null,
  setPdfUrl: (url) => {
    // Cleanup old blob URL
    const old = get().pdfUrl;
    if (old) {
try {
  URL.revokeObjectURL(old);
} catch {
  // Ignore errors from invalid URLs
}
    }
    set({ pdfUrl: url });
  },

  zoom: 100,
  setZoom: (z) => set({ zoom: z }),
  viewMode: 'single',
  setViewMode: (m) => set({ viewMode: m }),

  pdfPageCount: 1,
  setPdfPageCount: (n) => set({ pdfPageCount: n }),

  saveStatus: 'idle',
  setSaveStatus: (s) => set({ saveStatus: s }),

  cursorPosition: { line: 1, column: 1 },
  setCursorPosition: (p) => set({ cursorPosition: p }),

  darkMode: false,
  setDarkMode: (dark) => set({ darkMode: dark }),

  activeMobileTab: 'editor' as MobileTab,
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),

  activeDesktopLeftView: 'default' as DesktopLeftView,
  setActiveDesktopLeftView: (view) => set({ activeDesktopLeftView: view }),

  templates: [],
  setTemplates: (templates) => set({ templates }),
  templateLoading: false,
  setTemplateLoading: (loading) => set({ templateLoading: loading }),
  applyingTemplateId: null,
  setApplyingTemplateId: (id) => set({ applyingTemplateId: id })
}));
