import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddInsurancePolicyDialog } from './AddInsurancePolicyDialog';
import { DialogDescription } from '@/components/ui/dialog';

describe('AddInsurancePolicyDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByText(/Añadir Póliza de Seguro/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onSubmit = jest.fn();
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /crear póliza/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form', async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce({});
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/número de póliza/i), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText(/tipo de seguro/i), {
      target: { value: 'vida' },
    });
    fireEvent.change(screen.getByLabelText(/prima/i), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText(/cobertura/i), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear póliza/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
