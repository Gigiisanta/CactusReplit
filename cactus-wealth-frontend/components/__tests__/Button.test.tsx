import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    render(<Button variant='destructive'>Delete</Button>);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes correctly', () => {
    render(<Button size='lg'>Large Button</Button>);

    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('h-11');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button', { name: /disabled button/i });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as different HTML element when asChild is true', () => {
    render(
      <Button asChild>
        <a href='/test'>Link Button</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom Button</Button>);

    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = jest.fn();

    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref).toHaveBeenCalled();
  });

  it('handles keyboard interactions', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Keyboard Button</Button>);

    const button = screen.getByRole('button', { name: /keyboard button/i });
    button.focus();

    await user.keyboard(' '); // Space key
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}'); // Enter key
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
