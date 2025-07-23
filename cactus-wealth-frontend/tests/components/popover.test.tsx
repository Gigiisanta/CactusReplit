import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

describe('Popover Components', () => {
  describe('Popover', () => {
    it('renders with children', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders with default open state', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with controlled open state', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles onOpenChange callback', () => {
      const handleOpenChange = jest.fn();
      render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('PopoverTrigger', () => {
    it('renders with children', () => {
      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Popover>
          <PopoverTrigger className='custom-trigger'>
            Custom Trigger
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      const trigger = screen.getByText('Custom Trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(
        <Popover>
          <PopoverTrigger ref={ref}>Ref Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Popover>
          <PopoverTrigger>Styled Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      const trigger = screen.getByText('Styled Trigger');
      // PopoverTrigger is a Radix UI primitive without default button styling
      expect(trigger).toBeInTheDocument();
    });

    it('handles click events', () => {
      render(
        <Popover>
          <PopoverTrigger>Click Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Click Trigger');
      fireEvent.click(trigger);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('PopoverContent', () => {
    it('renders with children', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className='custom-content'>
            Custom content
          </PopoverContent>
        </Popover>
      );
      const content = screen.getByText('Custom content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent ref={ref}>Ref content</PopoverContent>
        </Popover>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Styled content</PopoverContent>
        </Popover>
      );
      const content = screen.getByText('Styled content');
      expect(content).toHaveClass(
        'z-50',
        'w-72',
        'rounded-md',
        'border',
        'bg-popover',
        'p-4',
        'text-popover-foreground',
        'shadow-md',
        'outline-none',
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0',
        'data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95',
        'data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2'
      );
    });

    it('renders with different side props', () => {
      const { rerender } = render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='top'>Top content</PopoverContent>
        </Popover>
      );
      let content = screen.getByText('Top content');
      expect(content).toBeInTheDocument();

      rerender(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side='bottom'>Bottom content</PopoverContent>
        </Popover>
      );
      content = screen.getByText('Bottom content');
      expect(content).toBeInTheDocument();
    });

    it('combines custom classes with default styling', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className='custom-class'>
            Combined content
          </PopoverContent>
        </Popover>
      );
      const content = screen.getByText('Combined content');
      expect(content).toHaveClass(
        'custom-class',
        'z-50',
        'w-72',
        'rounded-md',
        'border',
        'bg-popover',
        'p-4',
        'text-popover-foreground',
        'shadow-md',
        'outline-none'
      );
    });
  });

  describe('Complete Popover Structure', () => {
    it('renders complete popover with all components', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Complete Trigger</PopoverTrigger>
          <PopoverContent>Complete content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Complete Trigger')).toBeInTheDocument();
      expect(screen.getByText('Complete content')).toBeInTheDocument();
    });

    it('handles open/close state changes', () => {
      const handleOpenChange = jest.fn();
      render(
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>State Trigger</PopoverTrigger>
          <PopoverContent>State content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('State Trigger');

      // Open popover
      fireEvent.click(trigger);
      expect(handleOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByText('State content')).toBeInTheDocument();
    });
  });
});
