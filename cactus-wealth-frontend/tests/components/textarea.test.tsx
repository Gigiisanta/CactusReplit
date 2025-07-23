import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea Component', () => {
  it('renders with default props', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder='Enter description' />);
    const textarea = screen.getByPlaceholderText('Enter description');
    expect(textarea).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Textarea value='test content' readOnly />);
    const textarea = screen.getByDisplayValue('test content');
    expect(textarea).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Textarea className='custom-textarea' />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'new content' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('renders as disabled', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('renders with id', () => {
    render(<Textarea id='test-textarea' />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'test-textarea');
  });

  it('renders with name', () => {
    render(<Textarea name='test-name' />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('name', 'test-name');
  });

  it('renders as required', () => {
    render(<Textarea required />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('renders as readOnly', () => {
    render(<Textarea readOnly />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('renders with rows', () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('renders with cols', () => {
    render(<Textarea cols={50} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('cols', '50');
  });

  it('combines multiple props', () => {
    render(
      <Textarea
        id='test'
        name='test'
        placeholder='Enter text'
        required
        rows={4}
        className='custom-class'
      />
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'test');
    expect(textarea).toHaveAttribute('name', 'test');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveClass('custom-class');
  });

  it('has correct default styling', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[80px]',
      'w-full',
      'rounded-md',
      'border',
      'border-input'
    );
  });
});
