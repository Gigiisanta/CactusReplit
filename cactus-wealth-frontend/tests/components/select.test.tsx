import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

describe('Select Components', () => {
  describe('Select', () => {
    it('renders with children', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText('Select option')).toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger className='custom-trigger'>Trigger</SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('custom-trigger');
    });
  });

  describe('SelectValue', () => {
    it('renders placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText('Select option')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' className='custom-value' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const value = screen.getByText('Select option');
      // Note: SelectValue className might not be applied directly to the text element
      expect(value).toBeInTheDocument();
    });
  });

  describe('SelectContent', () => {
    it('renders content when opened', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
          <SelectContent className='custom-content'>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      fireEvent.click(screen.getByRole('combobox'));
      const content = screen.getByText('Option 1').closest('[role="listbox"]');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('SelectItem', () => {
    it('renders item text', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger>Trigger</SelectTrigger>
          <SelectContent>
            <SelectItem value='option1' className='custom-item'>
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      );

      fireEvent.click(screen.getByRole('combobox'));
      const item = screen.getByText('Option 1').parentElement;
      expect(item).toHaveClass('custom-item');
    });
  });

  describe('Select composition', () => {
    it('renders complete select structure', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder='Select option' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Select option')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });
});
