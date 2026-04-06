import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button.disabled).toBe(true);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Submit</Button>);

    expect(screen.getByRole('button').disabled).toBe(true);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Submit</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="secondary">Text</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('btn-secondary');
  });

  it('defaults to primary variant', () => {
    const { container } = render(<Button>Text</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('btn-primary');
  });

  it('applies tertiary variant styling', () => {
    const { container } = render(<Button variant="tertiary">Text</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('hover:underline');
    expect(button?.className).not.toContain('btn-primary');
    expect(button?.className).not.toContain('btn-secondary');
  });

  it('shows children when not loading', () => {
    render(<Button loading={false}>Submit</Button>);
    expect(screen.getByText('Submit')).toBeDefined();
    expect(screen.queryByText('Loading...')).toBeNull();
  });
});
