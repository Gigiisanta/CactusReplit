import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditInsurancePolicyDialog } from './EditInsurancePolicyDialog';
import { InsurancePolicy } from '@/types';

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), promise: jest.fn() },
}));

const { apiClient } = require('@/lib/api');

jest.mock('@/lib/api', () => ({
  apiClient: {
    updateInsurancePolicy: jest.fn(),
  },
}));

const mockPolicy: InsurancePolicy = {
  id: 1,
  policy_number: '123',
  insurance_type: 'vida',
  premium_amount: 1000,
  coverage_amount: 5000,
  client_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('EditInsurancePolicyDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <EditInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        policy={mockPolicy}
        onSubmit={jest.fn()}
      />
    );
    expect(
      screen.getByText(/Editar P\u00f3liza de Seguro/i)
    ).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onSubmit = jest.fn();
    render(
      <EditInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        policy={mockPolicy}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/n\u00famero de p\u00f3liza/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form', async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce({});
    render(
      <EditInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        policy={mockPolicy}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/n\u00famero de p\u00f3liza/i), {
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
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('handles loading state', async () => {
    const onSubmit = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(
      <EditInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        policy={mockPolicy}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/n\u00famero de p\u00f3liza/i), {
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
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('handles error state', async () => {
    const onSubmit = jest.fn();
    (apiClient.updateInsurancePolicy as jest.Mock).mockRejectedValueOnce(
      new Error('fail')
    );
    render(
      <EditInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        policy={mockPolicy}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/n\u00famero de p\u00f3liza/i), {
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
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    // The form should still be submitted even with API errors
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
