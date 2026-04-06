import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeftPanel } from '../LeftPanel';

// Mock child components that have external dependencies
vi.mock('../../ai/JobContext', () => ({
  JobContext: () => <div data-testid="job-context">JobContext</div>
}));

vi.mock('../../ai/AIChat', () => ({
  AIChat: () => <div data-testid="ai-chat">AIChat</div>
}));

describe('LeftPanel', () => {
  it('renders JobContext component', () => {
    render(<LeftPanel />);
    expect(screen.getByTestId('job-context')).toBeDefined();
  });

  it('renders AIChat component', () => {
    render(<LeftPanel />);
    expect(screen.getByTestId('ai-chat')).toBeDefined();
  });

  it('renders as a section with col-span-3 layout class', () => {
    const { container } = render(<LeftPanel />);
    const section = container.querySelector('section');
    expect(section?.className).toContain('col-span-3');
  });
});
