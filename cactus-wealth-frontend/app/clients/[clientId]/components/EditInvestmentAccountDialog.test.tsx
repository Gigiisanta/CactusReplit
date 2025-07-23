import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditInvestmentAccountDialog } from './EditInvestmentAccountDialog';
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), promise: jest.fn() },
}));
describe('EditInvestmentAccountDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={{
          id: 1,
          client_id: 1,
          platform: 'Test',
          aum: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByText(/Editar Cuenta de Inversión/i)).toBeInTheDocument();
  });
});
