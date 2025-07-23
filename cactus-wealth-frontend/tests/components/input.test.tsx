import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder='Enter text' />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Input value='test value' readOnly />);
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className='custom-input' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('renders as disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('renders with type', () => {
    render(<Input type='email' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with id', () => {
    render(<Input id='test-input' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('renders with name', () => {
    render(<Input name='test-name' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'test-name');
  });

  it('renders as required', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('renders as readOnly', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('combines multiple props', () => {
    render(
      <Input
        id='test'
        name='test'
        type='password'
        placeholder='Enter password'
        required
        className='custom-class'
      />
    );
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('id', 'test');
    expect(input).toHaveAttribute('name', 'test');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('placeholder', 'Enter password');
    expect(input).toBeRequired();
    expect(input).toHaveClass('custom-class');
  });

  it('has correct default styling', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input'
    );
  });
});
