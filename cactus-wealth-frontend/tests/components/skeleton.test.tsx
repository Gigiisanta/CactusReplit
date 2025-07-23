import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('div');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className='custom-skeleton' />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('has correct default styling', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass(
      'animate-pulse',
      'rounded-md',
      'bg-primary/10'
    );
  });

  it('combines default and custom classes', () => {
    const { container } = render(<Skeleton className='h-4 w-4' />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass(
      'animate-pulse',
      'rounded-md',
      'bg-primary/10',
      'h-4',
      'w-4'
    );
  });

  it('renders with different sizes', () => {
    const { container, rerender } = render(<Skeleton className='h-4 w-4' />);
    let skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-4', 'w-4');

    rerender(<Skeleton className='h-8 w-8' />);
    skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-8', 'w-8');
  });

  it('renders with different shapes', () => {
    const { container, rerender } = render(
      <Skeleton className='rounded-full' />
    );
    let skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');

    rerender(<Skeleton className='rounded-lg' />);
    skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-lg');
  });
});
