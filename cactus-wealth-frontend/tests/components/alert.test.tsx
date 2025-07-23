import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders with children', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByText('Alert content')).toBeInTheDocument();
    });

    it('applies default variant styles', () => {
      render(<Alert>Default alert</Alert>);
      const alert = screen.getByText('Default alert').closest('div');
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });

    it('applies custom className', () => {
      render(<Alert className='custom-alert'>Custom alert</Alert>);
      const alert = screen.getByText('Custom alert').closest('div');
      expect(alert).toHaveClass('custom-alert');
    });

    it('applies different variants', () => {
      const { rerender } = render(<Alert variant='default'>Default</Alert>);
      let alert = screen.getByText('Default').closest('div');
      expect(alert).toHaveClass('bg-background');

      rerender(<Alert variant='destructive'>Destructive</Alert>);
      alert = screen.getByText('Destructive').closest('div');
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });
  });

  describe('AlertTitle', () => {
    it('renders with children', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertTitle className='custom-title'>Custom Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Custom Title');
      expect(title).toHaveClass('custom-title');
    });

    it('has correct semantic role', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Alert Title');
      expect(title).toHaveClass(
        'mb-1',
        'font-medium',
        'leading-none',
        'tracking-tight'
      );
    });
  });

  describe('AlertDescription', () => {
    it('renders with children', () => {
      render(
        <Alert>
          <AlertDescription>Alert description text</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Alert description text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Alert>
          <AlertDescription className='custom-description'>
            Custom description
          </AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Custom description');
      expect(description).toHaveClass('custom-description');
    });

    it('has correct styling', () => {
      render(
        <Alert>
          <AlertDescription>Description text</AlertDescription>
        </Alert>
      );
      const description = screen.getByText('Description text');
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('Alert with all components', () => {
    it('renders complete alert structure', () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            This is an important message that requires your attention.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Important Notice')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is an important message that requires your attention.'
        )
      ).toBeInTheDocument();
    });

    it('applies destructive variant styling', () => {
      render(
        <Alert variant='destructive'>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );

      const alert = screen.getByText('Error').closest('div');
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Alert ref={ref}>
          <AlertTitle>Ref Test</AlertTitle>
        </Alert>
      );

      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.textContent).toContain('Ref Test');
    });
  });
});
