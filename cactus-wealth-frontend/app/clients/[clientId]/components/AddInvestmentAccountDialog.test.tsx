import { render, screen, fireEvent } from '@testing-library/react';
import { AddInvestmentAccountDialog } from './AddInvestmentAccountDialog';
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), promise: jest.fn() },
}));
describe('AddInvestmentAccountDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <AddInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByText(/Añadir Cuenta de Inversión/i)).toBeInTheDocument();
  });
});
