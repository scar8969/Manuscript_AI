import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../../store/useStore';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useStore.setState({ accessToken: null, user: null });
  });

  it('should include auth token when available', async () => {
    useStore.setState({ accessToken: 'test-token' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    const { api } = await import('../api');
    await api.auth.logout();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('should not include auth token when not available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true })
    });

    const { api } = await import('../api');
    await api.auth.logout();

    const call = mockFetch.mock.calls[0];
    expect(call[1].headers).not.toHaveProperty('Authorization');
  });

  it('should handle non-JSON error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Not JSON'); }
    });

    const { api } = await import('../api');
    await expect(api.auth.me()).rejects.toThrow('Request failed (500)');
  });

  it('should handle structured error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 'VALIDATION_ERROR', message: 'Email required' } })
    });

    const { api } = await import('../api');
    await expect(api.auth.me()).rejects.toThrow('Email required');
  });
});
