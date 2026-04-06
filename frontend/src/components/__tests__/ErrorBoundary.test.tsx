import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws
function ThrowOnRender({ error }: { error: Error }) {
  throw error;
}

function setup() {
  // Suppress console.error from React error boundaries
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

function cleanup() {
  vi.restoreAllMocks();
}

describe('ErrorBoundary', () => {
  beforeEach(setup);
  afterEach(cleanup);

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeDefined();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('renders default message when error has no message', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error('')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred.')).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowOnRender error={new Error('test')} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeDefined();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('resets error state when Try Again is clicked', () => {
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Boom')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered')).toBeDefined();
  });

  it('has Try Again button in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender error={new Error('test')} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
  });
});
