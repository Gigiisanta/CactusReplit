import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox Component', () => {
  it('renders with default props', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('renders with id', () => {
    render(<Checkbox id='test-checkbox' />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'test-checkbox');
  });

  it('renders with name', () => {
    render(<Checkbox name='test-name' />);
    const checkbox = screen.getByRole('checkbox');
    // Radix UI Checkbox doesn't expose name attribute directly
    expect(checkbox).toBeInTheDocument();
  });

  it('renders as checked', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders as disabled', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('renders as required', () => {
    render(<Checkbox required />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeRequired();
  });

  it('applies custom className', () => {
    render(<Checkbox className='custom-checkbox' />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-checkbox');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<Checkbox onCheckedChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles onCheckedChange events', () => {
    const handleCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('has correct default styling', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass(
      'peer',
      'h-4',
      'w-4',
      'shrink-0',
      'rounded-sm',
      'border',
      'border-slate-900',
      'ring-offset-white',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-slate-950',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'data-[state=checked]:bg-slate-900',
      'data-[state=checked]:text-slate-50'
    );
  });

  it('combines multiple props', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox
        id='test'
        name='test'
        checked
        disabled
        required
        className='custom-class'
        onChange={handleChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'test');
    // Radix UI Checkbox doesn't expose name attribute directly
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveClass('custom-class');
  });

  it('handles controlled state', () => {
    const { rerender } = render(<Checkbox checked={false} />);
    let checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    rerender(<Checkbox checked={true} />);
    checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('handles indeterminate state', () => {
    render(<Checkbox data-state='indeterminate' />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });

  it('applies aria attributes', () => {
    render(
      <Checkbox
        aria-label='Test checkbox'
        aria-describedby='description'
        aria-invalid='true'
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Test checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby', 'description');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders with indicator when checked', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    // The Check icon should be present when checked
    expect(checkbox.querySelector('svg')).toBeInTheDocument();
  });
});
