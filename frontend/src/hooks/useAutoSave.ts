import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { toast } from '../components/Toast';

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;

export function useAutoSave() {
  const { latexCode, isDirty, setIsDirty, setSaveStatus, documentId, user, saveStatus } = useStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const lastSavedCodeRef = useRef<string>('');

  useEffect(() => {
    if (!isDirty || !documentId || !user) return;
    if (latexCode === lastSavedCodeRef.current) {
      setIsDirty(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await api.documents.update(documentId, { latex: latexCode });
        setSaveStatus('saved');
        setIsDirty(false);
        lastSavedCodeRef.current = latexCode;
        retryCountRef.current = 0;
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        retryCountRef.current++;
        if (retryCountRef.current >= MAX_RETRIES) {
          setSaveStatus('error');
          toast(`Auto-save failed after ${MAX_RETRIES} retries`, 'error');
          retryCountRef.current = 0;
        } else {
          // Will retry with exponential backoff on next isDirty trigger
          setIsDirty(true);
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [latexCode, isDirty, documentId, user, setSaveStatus, setIsDirty]);

  // Reset retry count on successful save from other sources
  useEffect(() => {
    if (saveStatus === 'saved') {
      retryCountRef.current = 0;
    }
  }, [saveStatus]);
}
