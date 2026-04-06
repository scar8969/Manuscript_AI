import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('renders error message when error is provided', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeDefined();
  });

  it('does not render error message when no error', () => {
    render(<Input />);
    expect(screen.queryByText(/required/i)).toBeNull();
  });

  it('applies error styling when error is present', () => {
    const { container } = render(<Input error="Bad input" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('border-b-error');
  });

  it('passes through props to input', () => {
    render(<Input placeholder="Enter email" type="email" />);
    const input = screen.getByPlaceholderText('Enter email');
    expect(input.getAttribute('type')).toBe('email');
  });
});
