import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';

const DEBOUNCE_MS = 2000;

/**
 * Auto-compiles LaTeX after user stops typing for a short delay.
 * Skips backend call if the backend is unreachable, preventing
 * ECONNREFUSED errors from blocking the editor.
 */
export function useAutoCompile() {
  const { latexCode, compileStatus, setCompileStatus, setPdfUrl, setIsDirty, isDirty } = useStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latexCodeRef = useRef(latexCode);
  const backendDownRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  useEffect(() => {
    latexCodeRef.current = latexCode;
  }, [latexCode]);

  const doCompile = useCallback(async (code: string) => {
    // Don't compile if already compiling or backend is known to be down
    if (compileStatus === 'compiling' || backendDownRef.current) return;

    setCompileStatus('compiling');

    try {
      const { api } = await import('../services/api');
      const blob = await api.compile(code);
      const url = URL.createObjectURL(blob);

      // Revoke old URL if exists
      const oldUrl = useStore.getState().pdfUrl;
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }

      setPdfUrl(url);
      setCompileStatus('success');
      setIsDirty(false);
      backendDownRef.current = false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // If backend is unreachable, mark it down and stop retrying
      if (msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        backendDownRef.current = true;
        setCompileStatus('idle');
        // Try again after 30 seconds in case backend comes up
        retryTimerRef.current = setTimeout(() => {
          backendDownRef.current = false;
        }, 30000);
      } else {
        setCompileStatus('error', msg);
      }
    }
  }, [compileStatus, setCompileStatus, setPdfUrl, setIsDirty]);

  // Debounced auto-compile
  useEffect(() => {
    if (!latexCode) return;
    if (compileStatus === 'compiling') return;

    // Mark as dirty when code changes
    setIsDirty(true);

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      doCompile(latexCodeRef.current);
    }, DEBOUNCE_MS);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [latexCode, compileStatus, doCompile, setIsDirty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  return isDirty;
}