import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Card className='custom-card'>Custom card</Card>);
      const card = screen.getByText('Custom card').closest('div');
      expect(card).toHaveClass('custom-card');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Ref card</Card>);
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(<Card>Default card</Card>);
      const card = screen.getByText('Default card').closest('div');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });
  });

  describe('CardHeader', () => {
    it('renders with children', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader className='custom-header'>Custom header</CardHeader>
        </Card>
      );
      const header = screen.getByText('Custom header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardHeader ref={ref}>Ref header</CardHeader>
        </Card>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Card>
          <CardHeader>Default header</CardHeader>
        </Card>
      );
      const header = screen.getByText('Default header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders with children', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className='custom-title'>Custom Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Custom Title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardHeader>
            <CardTitle ref={ref}>Ref Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Default Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Default Title');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });
  });

  describe('CardDescription', () => {
    it('renders with children', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className='custom-description'>
              Custom Description
            </CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Custom Description');
      expect(description).toHaveClass('custom-description');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Card>
          <CardHeader>
            <CardDescription ref={ref}>Ref Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Default Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Default Description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with children', () => {
      render(
        <Card>
          <CardContent>Content text</CardContent>
        </Card>
      );
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardContent className='custom-content'>Custom content</CardContent>
        </Card>
      );
      const content = screen.getByText('Custom content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardContent ref={ref}>Ref content</CardContent>
        </Card>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Card>
          <CardContent>Default content</CardContent>
        </Card>
      );
      const content = screen.getByText('Default content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with children', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardFooter className='custom-footer'>Custom footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Custom footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardFooter ref={ref}>Ref footer</CardFooter>
        </Card>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Card>
          <CardFooter>Default footer</CardFooter>
        </Card>
      );
      const footer = screen.getByText('Default footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <p>This is the footer content.</p>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(
        screen.getByText('This is a complete card example')
      ).toBeInTheDocument();
      expect(
        screen.getByText('This is the main content of the card.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('This is the footer content.')
      ).toBeInTheDocument();
    });

    it('combines custom classes with default styling', () => {
      render(
        <Card className='custom-card'>
          <CardHeader className='custom-header'>
            <CardTitle className='custom-title'>Custom Card</CardTitle>
            <CardDescription className='custom-description'>
              Custom description
            </CardDescription>
          </CardHeader>
          <CardContent className='custom-content'>
            <p>Custom content</p>
          </CardContent>
          <CardFooter className='custom-footer'>
            <p>Custom footer</p>
          </CardFooter>
        </Card>
      );

      const card = screen
        .getByText('Custom Card')
        .closest('div')?.parentElement;
      expect(card).toHaveClass('custom-card');
      expect(screen.getByText('Custom description')).toHaveClass(
        'custom-description'
      );
      expect(screen.getByText('Custom content').closest('div')).toHaveClass(
        'custom-content'
      );
      expect(screen.getByText('Custom footer').closest('div')).toHaveClass(
        'custom-footer'
      );
    });
  });
});
