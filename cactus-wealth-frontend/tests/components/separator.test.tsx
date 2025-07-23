import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator Component', () => {
  it('renders with default props', () => {
    render(<Separator />);
    const separator = document.querySelector('[role="none"]');
    expect(separator).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Separator className='custom-separator' />);
    const separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('custom-separator');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('has correct default styling', () => {
    render(<Separator />);
    const separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('renders with orientation prop', () => {
    const { rerender } = render(<Separator orientation='horizontal' />);
    let separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('h-[1px]', 'w-full');

    rerender(<Separator orientation='vertical' />);
    separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('combines custom classes with orientation styling', () => {
    render(<Separator orientation='horizontal' className='custom-class' />);
    const separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('custom-class', 'h-[1px]', 'w-full');
  });

  it('renders with decorative prop', () => {
    render(<Separator decorative />);
    const separator = document.querySelector('[role="none"]');
    // The decorative prop is passed to Radix UI but doesn't add aria-hidden in tests
    expect(separator).toBeInTheDocument();
  });

  it('applies all HTML attributes', () => {
    render(
      <Separator
        id='test-separator'
        data-testid='separator'
        aria-label='Test separator'
        title='Separator tooltip'
      />
    );
    const separator = document.querySelector('[role="none"]');
    expect(separator).toHaveAttribute('id', 'test-separator');
    expect(separator).toHaveAttribute('data-testid', 'separator');
    expect(separator).toHaveAttribute('aria-label', 'Test separator');
    expect(separator).toHaveAttribute('title', 'Separator tooltip');
  });

  it('handles different orientations with decorative prop', () => {
    const { rerender } = render(
      <Separator orientation='horizontal' decorative />
    );
    let separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('h-[1px]', 'w-full');

    rerender(<Separator orientation='vertical' decorative />);
    separator = document.querySelector('[role="none"]');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });
});
