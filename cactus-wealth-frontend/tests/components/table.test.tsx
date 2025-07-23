import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

describe('Table Components', () => {
  describe('Table', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Table content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Table content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table className='custom-table'>
          <TableBody>
            <TableRow>
              <TableCell>Custom table</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByText('Custom table').closest('table');
      expect(table).toHaveClass('custom-table');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(
        <Table ref={ref}>
          <TableBody>
            <TableRow>
              <TableCell>Ref table</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Default table</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByText('Default table').closest('table');
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    });
  });

  describe('TableHeader', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header content</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableHeader className='custom-header'>
            <TableRow>
              <TableHead>Custom header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const header = screen.getByText('Custom header').closest('thead');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <Table>
          <TableHeader ref={ref}>
            <TableRow>
              <TableHead>Ref header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Default header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const header = screen.getByText('Default header').closest('thead');
      expect(header).toHaveClass('[&_tr]:border-b');
    });
  });

  describe('TableBody', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Body content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody className='custom-body'>
            <TableRow>
              <TableCell>Custom body</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const body = screen.getByText('Custom body').closest('tbody');
      expect(body).toHaveClass('custom-body');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <Table>
          <TableBody ref={ref}>
            <TableRow>
              <TableCell>Ref body</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Default body</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const body = screen.getByText('Default body').closest('tbody');
      expect(body).toHaveClass('[&_tr:last-child]:border-0');
    });
  });

  describe('TableRow', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Row content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow className='custom-row'>
              <TableCell>Custom row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = screen.getByText('Custom row').closest('tr');
      expect(row).toHaveClass('custom-row');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <Table>
          <TableBody>
            <TableRow ref={ref}>
              <TableCell>Ref row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Default row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = screen.getByText('Default row').closest('tr');
      expect(row).toHaveClass(
        'border-b',
        'transition-colors',
        'hover:bg-muted/50',
        'data-[state=selected]:bg-muted'
      );
    });
  });

  describe('TableHead', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Head content</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(screen.getByText('Head content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='custom-head'>Custom head</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const head = screen.getByText('Custom head');
      expect(head).toHaveClass('custom-head');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead ref={ref}>Ref head</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Default head</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const head = screen.getByText('Default head');
      expect(head).toHaveClass(
        'h-12',
        'px-4',
        'text-left',
        'align-middle',
        'font-medium',
        'text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0'
      );
    });
  });

  describe('TableCell', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Cell content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className='custom-cell'>Custom cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = screen.getByText('Custom cell');
      expect(cell).toHaveClass('custom-cell');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell ref={ref}>Ref cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Default cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = screen.getByText('Default cell');
      expect(cell).toHaveClass(
        'p-4',
        'align-middle',
        '[&:has([role=checkbox])]:pr-0'
      );
    });
  });

  describe('TableCaption', () => {
    it('renders with children', () => {
      render(
        <Table>
          <TableCaption>Caption text</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Table content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Caption text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableCaption className='custom-caption'>Custom caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Table content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const caption = screen.getByText('Custom caption');
      expect(caption).toHaveClass('custom-caption');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableCaptionElement>();
      render(
        <Table>
          <TableCaption ref={ref}>Ref caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Table content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInTheDocument();
    });

    it('has correct default styling', () => {
      render(
        <Table>
          <TableCaption>Default caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Table content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const caption = screen.getByText('Default caption');
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
    });
  });

  describe('Complete Table Structure', () => {
    it('renders complete table with all components', () => {
      render(
        <Table>
          <TableCaption>Complete Table Example</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>User</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Complete Table Example')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('combines custom classes with default styling', () => {
      render(
        <Table className='custom-table'>
          <TableCaption className='custom-caption'>Custom Table</TableCaption>
          <TableHeader className='custom-header'>
            <TableRow className='custom-header-row'>
              <TableHead className='custom-head'>Custom Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='custom-body'>
            <TableRow className='custom-row'>
              <TableCell className='custom-cell'>Custom Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByText('Custom Cell').closest('table');
      expect(table).toHaveClass('custom-table');
      expect(screen.getByText('Custom Table')).toHaveClass('custom-caption');
      expect(screen.getByText('Custom Header')).toHaveClass('custom-head');
      expect(screen.getByText('Custom Cell')).toHaveClass('custom-cell');
    });
  });
});
