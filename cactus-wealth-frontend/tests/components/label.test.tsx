import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  it('renders with children', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className='custom-label'>Custom Label</Label>);
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('custom-label');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInTheDocument();
  });

  it('renders with htmlFor attribute', () => {
    render(<Label htmlFor='test-input'>Input Label</Label>);
    const label = screen.getByText('Input Label');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('combines multiple props', () => {
    render(
      <Label htmlFor='test' className='custom-class'>
        Combined Label
      </Label>
    );
    const label = screen.getByText('Combined Label');
    expect(label).toHaveAttribute('for', 'test');
    expect(label).toHaveClass('custom-class');
  });

  it('has correct default styling', () => {
    render(<Label>Default Label</Label>);
    const label = screen.getByText('Default Label');
    expect(label).toHaveClass(
      'text-sm',
      'font-medium',
      'leading-none',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70'
    );
  });

  it('renders with different content types', () => {
    render(
      <Label>
        <span>Span content</span>
        <strong>Bold content</strong>
      </Label>
    );
    expect(screen.getByText('Span content')).toBeInTheDocument();
    expect(screen.getByText('Bold content')).toBeInTheDocument();
  });
});
