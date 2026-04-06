import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../layout/StatusBar';
import { useStore } from '../../store/useStore';

describe('StatusBar', () => {
  beforeEach(() => {
    useStore.setState({
      compileStatus: 'idle',
      saveStatus: 'idle',
      cursorPosition: { line: 1, column: 1 }
    });
  });

  it('shows Ready when compile is idle', () => {
    render(<StatusBar />);
    expect(screen.getByText('Ready')).toBeDefined();
  });

  it('shows Compiling when compiling', () => {
    useStore.setState({ compileStatus: 'compiling' });
    render(<StatusBar />);
    expect(screen.getByText('Compiling')).toBeDefined();
  });

  it('shows Success when compile succeeds', () => {
    useStore.setState({ compileStatus: 'success' });
    render(<StatusBar />);
    expect(screen.getByText(/Success/)).toBeDefined();
  });

  it('shows Failed when compile fails', () => {
    useStore.setState({ compileStatus: 'error' });
    render(<StatusBar />);
    expect(screen.getByText('Failed')).toBeDefined();
  });

  it('shows Saving... when saving', () => {
    useStore.setState({ saveStatus: 'saving' });
    render(<StatusBar />);
    expect(screen.getByText('Saving...')).toBeDefined();
  });

  it('shows Saved when save succeeds', () => {
    useStore.setState({ saveStatus: 'saved' });
    render(<StatusBar />);
    expect(screen.getByText('Saved')).toBeDefined();
  });

  it('shows Save Failed when save errors', () => {
    useStore.setState({ saveStatus: 'error' });
    render(<StatusBar />);
    expect(screen.getByText('Save Failed')).toBeDefined();
  });

  it('shows cursor position', () => {
    useStore.setState({ cursorPosition: { line: 42, column: 8 } });
    render(<StatusBar />);
    expect(screen.getByText(/Line 42, Col 8/)).toBeDefined();
  });

  it('shows pdfLaTeX engine label', () => {
    render(<StatusBar />);
    expect(screen.getByText('Engine: pdfLaTeX')).toBeDefined();
  });
});
