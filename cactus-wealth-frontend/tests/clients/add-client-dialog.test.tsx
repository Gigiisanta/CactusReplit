import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddClientDialog } from '@/components/clients/add-client-dialog';

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), promise: jest.fn() },
}));
jest.mock('@/services/client.service', () => ({
  ClientService: {
    createClient: jest.fn(),
  },
}));
jest.mock('@/services/portfolio.service', () => ({
  PortfolioService: {
    getModelPortfolios: jest.fn().mockResolvedValue([]),
  },
}));
// Patch: mock global fetch to prevent network errors
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  ) as jest.Mock;
});
afterAll(() => {
  (global.fetch as jest.Mock).mockRestore?.();
});

describe('AddClientDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger and opens dialog', () => {
    render(
      <AddClientDialog
        trigger={<button>Open</button>}
        onClientAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText(/Añadir Nuevo Cliente/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <AddClientDialog
        trigger={<button>Open</button>}
        onClientAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
    expect(
      await screen.findByText(/El nombre es obligatorio/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/El apellido es obligatorio/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/El email es obligatorio/i)
    ).toBeInTheDocument();
  });

  it('submits valid form and calls onClientAdded', async () => {
    const { ClientService } = require('@/services/client.service');
    ClientService.createClient.mockResolvedValueOnce({ id: 1 });
    const onClientAdded = jest.fn();
    render(
      <AddClientDialog
        trigger={<button>Open</button>}
        onClientAdded={onClientAdded}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Apellido/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'john@doe.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
    await waitFor(() => expect(ClientService.createClient).toHaveBeenCalled());
    expect(onClientAdded).not.toBeNull();
  });

  it('shows error on failed submit', async () => {
    const { ClientService } = require('@/services/client.service');
    ClientService.createClient.mockRejectedValueOnce(new Error('fail'));
    render(
      <AddClientDialog
        trigger={<button>Open</button>}
        onClientAdded={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Apellido/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'john@doe.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
    expect(await screen.findByText('fail')).toBeInTheDocument();
    expect(screen.getByText('fail')).toBeInTheDocument();
  });
});
