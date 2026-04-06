import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { SideNav } from './components/layout/SideNav';
import { LeftPanel } from './components/layout/LeftPanel';
import { StatusBar } from './components/layout/StatusBar';
import { LatexEditor } from './components/editor/LatexEditor';
import { PDFPreview } from './components/preview/PDFPreview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { useStore } from './store/useStore';
import { useAutoSave } from './hooks/useAutoSave';
import { TemplateSelector } from './components/ai/TemplateSelector';

// ── Editor Layout ────────────────────────────────────────────────────
function EditorLayout() {
  const { user, setAuth, setDocument, documentId } = useStore();
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);

  useAutoSave();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user, '');
        }
      } catch {
        // Not authenticated
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, [setAuth]);

  useEffect(() => {
    if (user && !documentId && !docLoading) {
      setDocLoading(true);
      const createDoc = async () => {
        try {
          const res = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title: 'Untitled Resume',
              latex: useStore.getState().latexCode
            })
          });
          if (res.ok) {
            const doc = await res.json();
            setDocument(doc.id, doc.title);
          }
        } catch {
          // Document creation failed
        } finally {
          setDocLoading(false);
        }
      };
      createDoc();
    }
  }, [user, documentId, setDocument, docLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center animate-fade-in">
          <span className="font-['Noto_Serif'] text-3xl font-black text-black tracking-tighter italic block mb-4">
            Manuscript AI
          </span>
          <div className="w-32 h-0.5 bg-surface-container rounded-full mx-auto overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full" style={{ animation: 'shimmer 1.5s infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex flex-1 overflow-hidden relative">
        <SideNav />
        <main className="ml-20 flex-1 overflow-hidden pb-8">
          <div className="hidden lg:grid lg:grid-cols-12 gap-0 h-full">
            <ErrorBoundary>
              <LeftPanel />
            </ErrorBoundary>
            <ErrorBoundary>
              <LatexEditor />
            </ErrorBoundary>
            <ErrorBoundary>
              <PDFPreview />
            </ErrorBoundary>
          </div>
          <div className="lg:hidden flex flex-col h-full">
            <EditorTabs />
          </div>
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}

const mobileTabs = [
  { id: 'context' as const, label: 'Job & AI', icon: 'work' },
  { id: 'editor' as const, label: 'Editor', icon: 'code_blocks' },
  { id: 'preview' as const, label: 'Preview', icon: 'picture_as_pdf' },
  { id: 'templates' as const, label: 'Templates', icon: 'dashboard_customize' },
];

function EditorTabs() {
  const { activeMobileTab, setActiveMobileTab } = useStore();
  return (
    <>
      <div className="flex bg-surface-container-lowest ghost-border">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id)}
            className={`relative flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
              activeMobileTab === tab.id
                ? 'text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{
              fontVariationSettings: activeMobileTab === tab.id ? "'FILL' 1" : "'FILL' 0"
            }}>
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
            {activeMobileTab === tab.id && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeMobileTab === 'context' && (
          <ErrorBoundary>
            <LeftPanel />
          </ErrorBoundary>
        )}
        {activeMobileTab === 'editor' && (
          <ErrorBoundary>
            <LatexEditor />
          </ErrorBoundary>
        )}
        {activeMobileTab === 'preview' && (
          <ErrorBoundary>
            <PDFPreview />
          </ErrorBoundary>
        )}
        {activeMobileTab === 'templates' && (
          <ErrorBoundary>
            <TemplateSelector />
          </ErrorBoundary>
        )}
      </div>
    </>
  );
}

// ── App with Routes ──────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
