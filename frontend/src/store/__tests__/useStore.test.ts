import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      user: null,
      accessToken: null,
      documentId: null,
      documentTitle: 'Untitled Resume',
      latexCode: useStore.getState().latexCode, // keep default
      isDirty: false,
      jobContext: { url: '', description: '', title: '', company: '' },
      analysis: null,
      analysisStatus: 'idle',
      messages: [],
      compileStatus: 'idle',
      compileError: null,
      pdfUrl: null,
      zoom: 100,
      viewMode: 'single',
      saveStatus: 'idle',
      cursorPosition: { line: 1, column: 1 },
      darkMode: false,
      activeMobileTab: 'editor'
    });
  });

  it('should set auth user and token', () => {
    useStore.getState().setAuth({ id: '1', email: 'test@test.com', name: 'Test' }, 'token123');
    expect(useStore.getState().user).toEqual({ id: '1', email: 'test@test.com', name: 'Test' });
    expect(useStore.getState().accessToken).toBe('token123');
  });

  it('should clear auth', () => {
    useStore.getState().setAuth({ id: '1', email: 'test@test.com', name: 'Test' }, 'token123');
    useStore.getState().clearAuth();
    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().accessToken).toBeNull();
  });

  it('should set latex code and mark dirty', () => {
    useStore.getState().setLatexCode('\\new code');
    expect(useStore.getState().latexCode).toBe('\\new code');
    expect(useStore.getState().isDirty).toBe(true);
  });

  it('should update job context partially', () => {
    useStore.getState().setJobContext({ title: 'Engineer', company: 'Acme' });
    expect(useStore.getState().jobContext.title).toBe('Engineer');
    expect(useStore.getState().jobContext.company).toBe('Acme');
    expect(useStore.getState().jobContext.url).toBe(''); // unchanged
  });

  it('should add messages', () => {
    useStore.getState().addMessage({ id: '1', role: 'user', content: 'hello', timestamp: 0 });
    useStore.getState().addMessage({ id: '2', role: 'assistant', content: 'hi', timestamp: 0 });
    expect(useStore.getState().messages).toHaveLength(2);
  });

  it('should clear messages', () => {
    useStore.getState().addMessage({ id: '1', role: 'user', content: 'hello', timestamp: 0 });
    useStore.getState().clearMessages();
    expect(useStore.getState().messages).toHaveLength(0);
  });

  it('should set compile status with error', () => {
    useStore.getState().setCompileStatus('error', 'line 42 error');
    expect(useStore.getState().compileStatus).toBe('error');
    expect(useStore.getState().compileError).toBe('line 42 error');
  });

  it('should set compile status without error', () => {
    useStore.getState().setCompileStatus('compiling');
    expect(useStore.getState().compileStatus).toBe('compiling');
    expect(useStore.getState().compileError).toBeNull();
  });

  it('should set pdfUrl', () => {
    useStore.getState().setPdfUrl('blob:http://localhost/new');
    expect(useStore.getState().pdfUrl).toBe('blob:http://localhost/new');
  });

  it('should set pdfUrl to null', () => {
    useStore.setState({ pdfUrl: 'blob:http://localhost/old' });
    useStore.getState().setPdfUrl(null);
    expect(useStore.getState().pdfUrl).toBeNull();
  });

  it('should handle null pdfUrl cleanup', () => {
    useStore.setState({ pdfUrl: null });
    // Should not throw
    useStore.getState().setPdfUrl('blob:http://localhost/new');
    expect(useStore.getState().pdfUrl).toBe('blob:http://localhost/new');
  });

  it('should zoom within bounds', () => {
    useStore.getState().setZoom(200);
    expect(useStore.getState().zoom).toBe(200);
    useStore.getState().setZoom(50);
    expect(useStore.getState().zoom).toBe(50);
  });

  it('should toggle dark mode', () => {
    expect(useStore.getState().darkMode).toBe(false);
    useStore.getState().setDarkMode(true);
    expect(useStore.getState().darkMode).toBe(true);
  });

  it('should set document', () => {
    useStore.getState().setDocument('doc-123', 'My Resume');
    expect(useStore.getState().documentId).toBe('doc-123');
    expect(useStore.getState().documentTitle).toBe('My Resume');
  });

  it('should set mobile tab', () => {
    useStore.getState().setActiveMobileTab('preview');
    expect(useStore.getState().activeMobileTab).toBe('preview');
  });
});
