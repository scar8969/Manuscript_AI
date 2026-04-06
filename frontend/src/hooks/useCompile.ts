import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

export function useCompile() {
  const { latexCode, setCompileStatus, setPdfUrl, pdfUrl, setPdfPageCount } = useStore();

  /**
   * Compile: calls the backend to compile LaTeX and shows the PDF preview
   */
  const compile = useCallback(async () => {
    setCompileStatus('compiling');
    try {
      const blob = await api.compile(latexCode);
      const url = URL.createObjectURL(blob);

      // Revoke old URL if exists
      const oldUrl = useStore.getState().pdfUrl;
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }

      setPdfUrl(url);
      setPdfPageCount(1);
      setCompileStatus('success');
    } catch (err: unknown) {
      console.error('Compile error:', err);
      setCompileStatus('error', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [latexCode, setCompileStatus, setPdfUrl, setPdfPageCount]);

  /**
   * Download: same as compile but also triggers a file download
   */
  const download = useCallback(async () => {
    setCompileStatus('compiling');
    try {
      const blob = await api.compile(latexCode);
      const url = URL.createObjectURL(blob);

      // Revoke old URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
      setPdfPageCount(1);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      a.click();

      setCompileStatus('success');
    } catch (err: unknown) {
      console.error('Compile error:', err);
      setCompileStatus('error', err instanceof Error ? err.message : 'Unknown error');
    }
  }, [latexCode, setCompileStatus, setPdfUrl, pdfUrl, setPdfPageCount]);

  return { compile, download };
}
