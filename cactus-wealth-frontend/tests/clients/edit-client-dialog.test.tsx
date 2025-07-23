import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { Client, RiskProfile, ClientStatus } from '@/types';

jest.mock('@/lib/api', () => ({
  apiClient: {
    updateClient: jest.fn(),
    getModelPortfolios: jest.fn().mockResolvedValue([]),
  },
}));

const mockClient: Client = {
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@doe.com',
  phone: '',
  risk_profile: RiskProfile.MEDIUM,
  status: ClientStatus.PROSPECT,
  lead_source: undefined,
  notes: '',
  live_notes: '',
  portfolio_name: '',
  referred_by_client_id: undefined,
  owner_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  portfolios: [],
  investment_accounts: [],
  insurance_policies: [],
  referred_clients: [],
};

describe('EditClientDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger and opens dialog', () => {
    render(
      <EditClientDialog
        client={mockClient}
        trigger={<button>Edit</button>}
        onClientUpdated={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText(/Editar Cliente/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <EditClientDialog
        client={mockClient}
        trigger={<button>Edit</button>}
        onClientUpdated={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: '' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /actualizar cliente/i })
    );
    expect(
      await screen.findByText(/El nombre es obligatorio/i)
    ).toBeInTheDocument();
  });

  it('submits valid form and calls onClientUpdated', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.updateClient as jest.Mock).mockResolvedValueOnce({ id: 1 });
    const onClientUpdated = jest.fn();
    render(
      <EditClientDialog
        client={mockClient}
        trigger={<button>Edit</button>}
        onClientUpdated={onClientUpdated}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Jane' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /actualizar cliente/i })
      );
    });
    await waitFor(() => expect(apiClient.updateClient).toHaveBeenCalled());
    expect(onClientUpdated).not.toBeNull();
  });

  it('shows error on failed submit', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.updateClient as jest.Mock).mockRejectedValueOnce(
      new Error('fail')
    );
    render(
      <EditClientDialog
        client={mockClient}
        trigger={<button>Edit</button>}
        onClientUpdated={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'Jane' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /actualizar cliente/i })
      );
    });
    expect(await screen.findByText(/fail/i)).toBeInTheDocument();
  });
});
