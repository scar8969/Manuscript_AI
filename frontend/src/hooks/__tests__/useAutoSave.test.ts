import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from '../../store/useStore';

describe('useAutoSave logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not save when documentId is null', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    useStore.setState({
      isDirty: true,
      documentId: null,
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      latexCode: '\\new code'
    });

    vi.advanceTimersByTime(3000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not save when user is null', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    useStore.setState({
      isDirty: true,
      documentId: 'doc-1',
      user: null,
      latexCode: '\\new code'
    });

    vi.advanceTimersByTime(3000);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not save when not dirty', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    useStore.setState({
      isDirty: false,
      documentId: 'doc-1',
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      latexCode: '\\new code'
    });

    vi.advanceTimersByTime(3000);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
