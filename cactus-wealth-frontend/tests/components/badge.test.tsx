import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders with children', () => {
    render(<Badge>Badge content</Badge>);
    expect(screen.getByText('Badge content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className='custom-badge'>Custom badge</Badge>);
    const badge = screen.getByText('Custom badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('has correct default styling', () => {
    render(<Badge>Default badge</Badge>);
    const badge = screen.getByText('Default badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-md',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('renders with variant prop', () => {
    const { rerender } = render(
      <Badge variant='default'>Default variant</Badge>
    );
    let badge = screen.getByText('Default variant');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-primary',
      'text-primary-foreground',
      'hover:bg-primary/80'
    );

    rerender(<Badge variant='secondary'>Secondary variant</Badge>);
    badge = screen.getByText('Secondary variant');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-secondary',
      'text-secondary-foreground',
      'hover:bg-secondary/80'
    );

    rerender(<Badge variant='destructive'>Destructive variant</Badge>);
    badge = screen.getByText('Destructive variant');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-destructive',
      'text-destructive-foreground',
      'hover:bg-destructive/80'
    );

    rerender(<Badge variant='outline'>Outline variant</Badge>);
    badge = screen.getByText('Outline variant');
    expect(badge).toHaveClass('text-foreground');
  });

  it('combines custom classes with variant styling', () => {
    render(
      <Badge variant='default' className='custom-class'>
        Combined badge
      </Badge>
    );
    const badge = screen.getByText('Combined badge');
    expect(badge).toHaveClass(
      'custom-class',
      'border-transparent',
      'bg-primary',
      'text-primary-foreground'
    );
  });

  it('renders with different content types', () => {
    render(
      <Badge>
        <span>Span content</span>
        <strong>Strong content</strong>
      </Badge>
    );
    expect(screen.getByText('Span content')).toBeInTheDocument();
    expect(screen.getByText('Strong content')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    render(<Badge />);
    const badge = document.querySelector('[class*="inline-flex"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies all HTML attributes', () => {
    render(
      <Badge
        id='test-badge'
        data-testid='badge'
        aria-label='Test badge'
        title='Badge tooltip'
      >
        Test badge
      </Badge>
    );
    const badge = screen.getByText('Test badge');
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('data-testid', 'badge');
    expect(badge).toHaveAttribute('aria-label', 'Test badge');
    expect(badge).toHaveAttribute('title', 'Badge tooltip');
  });
});
