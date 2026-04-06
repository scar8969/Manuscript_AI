import React from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { toast } from '../Toast';

export function TopNav() {
  const { user, clearAuth, documentTitle, setDocumentTitle } = useStore();
  const [showLogin, setShowLogin] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isRegister, setIsRegister] = React.useState(false);
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState('');
  const modalRef = React.useRef<HTMLDivElement>(null);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const startRename = () => {
    setDraftTitle(documentTitle);
    setEditingTitle(true);
  };

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed) setDocumentTitle(trimmed);
    setEditingTitle(false);
  };

  const cancelRename = () => setEditingTitle(false);

  React.useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    setLoading(true);
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    try {
      const res = await fetch('/api' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name: isRegister ? (name || email.split('@')[0]) : undefined })
      });
      const data = await res.json();
      if (res.ok) {
        useStore.getState().setAuth(data.user, data.accessToken);
        setShowLogin(false);
        setEmail('');
        setPassword('');
        setName('');
        toast(isRegister ? 'Account created!' : 'Welcome back!', 'success');
      } else {
        toast(data.error?.message || 'Auth failed', 'error');
      }
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    clearAuth();
    toast('Signed out', 'info');
  };

  React.useEffect(() => {
    if (showLogin) {
      modalRef.current?.focus();
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowLogin(false);
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showLogin]);

  return (
    <header className="bg-white flex justify-between items-center px-8 h-16 w-full top-0 z-50">
      <div className="flex items-center gap-8">
        <span className="font-['Noto_Serif'] text-2xl font-black text-black tracking-tighter italic">
          Manuscript AI
        </span>
        <span className="text-on-surface-variant/40">/</span>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
            className="text-sm font-semibold text-on-surface bg-transparent border-b-2 border-primary outline-none px-1 py-0.5 w-48"
            autoFocus
          />
        ) : (
          <button
            onClick={startRename}
            className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer flex items-center gap-1"
            title="Click to rename"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            {documentTitle}
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-on-surface-variant hidden md:inline max-w-[160px] truncate">{user.email}</span>
            <Button variant="tertiary" onClick={handleLogout}>Logout</Button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden ml-2">
              <span className="text-sm font-bold text-on-surface">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setShowLogin(true); setIsRegister(false); }}
              className="px-4 py-2 border border-outline-variant text-sm font-medium hover:bg-surface-container transition-all"
            >
              Sign In
            </button>
            <Button onClick={() => { setShowLogin(true); setIsRegister(true); }}>
              New Project
            </Button>
          </>
        )}
      </div>

      {showLogin && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <div
            ref={modalRef}
            className="bg-surface-container-lowest p-8 w-[400px] max-w-[90vw] shadow-lg animate-fade-in relative"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0px 12px 32px rgba(25, 28, 30, 0.06)' }}
          >
            <div className="flex flex-col items-center mb-6">
              <span className="font-['Noto_Serif'] text-2xl font-black text-black tracking-tighter italic">
                Manuscript AI
              </span>
            </div>
            <h2 id="auth-title" className="font-headline text-xl font-bold text-on-surface text-center mb-1">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              {isRegister ? 'Start tailoring resumes with AI' : 'Sign in to continue'}
            </p>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              {isRegister && (
                <div className="animate-fade-in">
                  <label htmlFor="auth-name" className="label">Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field w-full text-sm px-3 py-2 outline-none"
                  />
                </div>
              )}
              <div>
                <label htmlFor="auth-email" className="label">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full text-sm px-3 py-2 outline-none"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="label">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full text-sm px-3 py-2 outline-none"
                  required
                  minLength={8}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
              <Button type="submit" loading={loading} className="mt-1 py-2.5">{isRegister ? 'Create Account' : 'Sign In'}</Button>
            </form>
            <div className="mt-5 pt-4 ghost-border">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary font-medium w-full hover:underline text-center"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-surface-container transition-colors"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
