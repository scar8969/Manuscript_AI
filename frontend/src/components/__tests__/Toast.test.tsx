import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore, toast } from '../Toast';

describe('Toast store', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('starts with empty toasts', () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('adds a toast with default error type', () => {
    useToastStore.getState().addToast('Something went wrong');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Something went wrong');
    expect(toasts[0].type).toBe('error');
  });

  it('adds a toast with specified type', () => {
    useToastStore.getState().addToast('Success!', 'success');

    const toasts = useToastStore.getState().toasts;
    expect(toasts[0].type).toBe('success');
  });

  it('removes a toast by id', () => {
    useToastStore.getState().addToast('First');
    useToastStore.getState().addToast('Second');

    const firstId = useToastStore.getState().toasts[0].id;
    useToastStore.getState().removeToast(firstId);

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Second');
  });

  it('auto-removes toast after 5 seconds', async () => {
    vi.useFakeTimers();

    useToastStore.getState().addToast('Auto-remove test');

    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);

    expect(useToastStore.getState().toasts).toHaveLength(0);

    vi.useRealTimers();
  });

  it('generates unique ids for each toast', () => {
    useToastStore.getState().addToast('A');
    useToastStore.getState().addToast('B');

    const toasts = useToastStore.getState().toasts;
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});

describe('toast function', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('adds toast via helper function', () => {
    toast('Quick error');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].type).toBe('error');
  });

  it('adds toast with custom type via helper', () => {
    toast('Quick info', 'info');
    expect(useToastStore.getState().toasts[0].type).toBe('info');
  });
});
