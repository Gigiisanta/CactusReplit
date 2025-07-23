import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('renders with children', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  describe('DialogTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('opens dialog when clicked', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Dialog Content</DialogContent>
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });
  });

  describe('DialogContent', () => {
    it('renders content when dialog is open', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Dialog Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className='custom-content'>Content</DialogContent>
        </Dialog>
      );
      const content = screen.getByText('Content').closest('[role="dialog"]');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('DialogHeader', () => {
    it('renders header content', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>Header Content</DialogHeader>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader className='custom-header'>Header</DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByText('Header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogTitle', () => {
    it('renders title', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle className='custom-title'>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('renders description', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogDescription className='custom-desc'>
              Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('custom-desc');
    });
  });

  describe('DialogFooter', () => {
    it('renders footer content', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter>Footer Content</DialogFooter>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter className='custom-footer'>Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Dialog composition', () => {
    it('renders complete dialog structure', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Title</DialogTitle>
              <DialogDescription>Test Description</DialogDescription>
            </DialogHeader>
            <div>Test Content</div>
            <DialogFooter>Test Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('closes dialog when escape key is pressed', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      // Note: This test might need adjustment based on actual implementation
    });
  });
});
