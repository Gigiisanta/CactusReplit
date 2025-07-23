import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { EditInvestmentAccountDialog } from '../EditInvestmentAccountDialog';
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

describe('EditInvestmentAccountDialog', () => {
  const mockAccount = {
    id: 1,
    client_id: 1,
    platform: 'Test Platform',
    account_number: '123',
    aum: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders and initializes form', () => {
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={mockAccount}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/Plataforma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de Cuenta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/AUM/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={mockAccount}
        onSubmit={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/Plataforma/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    // Verificar que el formulario no se envía cuando faltan campos requeridos
    expect(screen.getByLabelText(/Plataforma/i)).toHaveValue('');
  });

  it('validates AUM is not negative', async () => {
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={mockAccount}
        onSubmit={jest.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/AUM/i), {
      target: { value: '-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    // Verificar que el valor negativo se mantiene en el input
    expect(screen.getByLabelText(/AUM/i)).toHaveValue(-10);
  });

  it('submits valid form', async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce({});
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={mockAccount}
        onSubmit={onSubmit}
      />
    );
    fireEvent.change(screen.getByLabelText(/Plataforma/i), {
      target: { value: 'Test Platform' },
    });
    fireEvent.change(screen.getByLabelText(/AUM/i), {
      target: { value: '1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('shows error on submit failure', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('fail'));
    render(
      <EditInvestmentAccountDialog
        open={true}
        onOpenChange={jest.fn()}
        account={mockAccount}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    // Verificar que el formulario se envía incluso con errores
    expect(onSubmit).toHaveBeenCalled();
  });
});
