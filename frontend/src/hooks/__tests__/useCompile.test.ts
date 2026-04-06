import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCompile } from '../useCompile';
import { useStore } from '../../store/useStore';

// Mock URL.createObjectURL for jsdom
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/fake-pdf');
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
  ...(globalThis.URL as object),
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL
});

// Mock api
vi.mock('../../services/api', () => ({
  api: {
    compile: vi.fn()
  }
}));

import { api } from '../../services/api';

describe('useCompile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      latexCode: '\\documentclass{article}',
      compileStatus: 'idle',
      compileError: null,
      pdfUrl: null
    });
  });

  it('returns compile and download functions', () => {
    const { result } = renderHook(() => useCompile());
    expect(result.current.compile).toBeDefined();
    expect(result.current.download).toBeDefined();
  });

  it('sets compile status to success without calling backend', async () => {
    const { result } = renderHook(() => useCompile());

    await act(async () => {
      await result.current.compile();
    });

    // compile() should NOT call the API - it's pseudo-compile
    expect(api.compile).not.toHaveBeenCalled();
    expect(useStore.getState().compileStatus).toBe('success');
  });

  it('shows brief compiling animation before success', async () => {
    const { result } = renderHook(() => useCompile());

    await act(async () => {
      result.current.compile();
    });

    await waitFor(() => {
      expect(useStore.getState().compileStatus).toBe('success');
    }, { timeout: 500 });
  });

  it('download calls the real API and creates blob URL', async () => {
    const mockBlob = new Blob(['%PDF-fake'], { type: 'application/pdf' });
    vi.mocked(api.compile).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useCompile());

    await act(async () => {
      await result.current.download();
    });

    expect(api.compile).toHaveBeenCalledWith('\\documentclass{article}');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(useStore.getState().compileStatus).toBe('success');
  });

  it('sets compile status to error on download failure', async () => {
    vi.mocked(api.compile).mockRejectedValue(new Error('Compile failed'));

    const { result } = renderHook(() => useCompile());

    await act(async () => {
      await result.current.download();
    });

    expect(useStore.getState().compileStatus).toBe('error');
    expect(useStore.getState().compileError).toBe('Compile failed');
  });

  it('sets generic error message when error is not an Error instance', async () => {
    vi.mocked(api.compile).mockRejectedValue('string error');

    const { result } = renderHook(() => useCompile());

    await act(async () => {
      await result.current.download();
    });

    expect(useStore.getState().compileError).toBe('Unknown error');
  });

  it('calls URL.revokeObjectURL for old pdfUrl before setting new one during download', async () => {
    const mockBlob = new Blob(['%PDF'], { type: 'application/pdf' });
    vi.mocked(api.compile).mockResolvedValue(mockBlob);
    useStore.setState({ pdfUrl: 'blob:http://localhost/old-pdf' });

    const { result } = renderHook(() => useCompile());

    await act(async () => {
      await result.current.download();
    });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/old-pdf');
  });
});