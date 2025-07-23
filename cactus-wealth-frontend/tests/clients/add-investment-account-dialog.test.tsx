import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { AddInvestmentAccountDialog } from '@/components/clients/add-investment-account-dialog';

jest.mock('@/lib/api', () => ({
  apiClient: {
    createInvestmentAccount: jest.fn(),
  },
}));
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), promise: jest.fn() },
}));

describe('AddInvestmentAccountDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders trigger and opens dialog', () => {
    render(
      <AddInvestmentAccountDialog
        clientId={1}
        trigger={<button>Open</button>}
        onAccountAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText(/Añadir Cuenta de Inversión/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <AddInvestmentAccountDialog
        clientId={1}
        trigger={<button>Open</button>}
        onAccountAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    await waitFor(() => {
      expect(
        screen.getByText(/la plataforma es obligatoria/i)
      ).toBeInTheDocument();
    });
  });

  it('submits valid form and calls onAccountAdded', async () => {
    const { apiClient } = require('@/lib/api');
    apiClient.createInvestmentAccount.mockResolvedValueOnce({ id: 1 });
    const onAccountAdded = jest.fn();
    render(
      <AddInvestmentAccountDialog
        clientId={1}
        trigger={<button>Open</button>}
        onAccountAdded={onAccountAdded}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(screen.getByLabelText(/Plataforma/i), {
      target: { value: 'Test Platform' },
    });
    fireEvent.change(screen.getByLabelText(/AUM/i), {
      target: { value: '1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    await waitFor(() => {
      expect(apiClient.createInvestmentAccount).toHaveBeenCalled();
      expect(onAccountAdded).toHaveBeenCalled();
    });
  });

  it('shows error on failed submit', async () => {
    const { apiClient } = require('@/lib/api');
    apiClient.createInvestmentAccount.mockRejectedValueOnce(new Error('fail'));
    render(
      <AddInvestmentAccountDialog
        clientId={1}
        trigger={<button>Open</button>}
        onAccountAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(screen.getByLabelText(/Plataforma/i), {
      target: { value: 'Test Platform' },
    });
    fireEvent.change(screen.getByLabelText(/AUM/i), {
      target: { value: '1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await act(async () => {
      jest.runAllTimers();
    });
    await waitFor(() => {
      expect(screen.getByText(/fail/i)).toBeInTheDocument();
    });
  });
});
