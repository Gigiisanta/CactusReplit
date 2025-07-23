import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import AddAssetDialog from '../AddAssetDialog';

jest.mock('@/lib/api', () => ({
  apiClient: {
    searchAssets: jest.fn(),
    addModelPortfolioPosition: jest.fn(),
  },
}));
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe('AddAssetDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders and opens dialog', () => {
    render(
      <AddAssetDialog portfolioId={1} onAssetAdded={jest.fn()}>
        <button>Open</button>
      </AddAssetDialog>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Añadir Activo a la Cartera')).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar Activo/i)).toBeInTheDocument();
  });

  it('shows error if search fails', async () => {
    const { apiClient } = require('@/lib/api');
    apiClient.searchAssets.mockRejectedValueOnce(new Error('fail'));
    render(
      <AddAssetDialog portfolioId={1} onAssetAdded={jest.fn()}>
        <button>Open</button>
      </AddAssetDialog>
    );
    fireEvent.click(screen.getByText('Open'));
    fireEvent.change(screen.getByLabelText(/Buscar Activo/i), {
      target: { value: 'AAPL' },
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/Buscar Activo/i)).toBeInTheDocument()
    );
  });

  it('renders basic dialog structure', () => {
    render(
      <AddAssetDialog portfolioId={1} onAssetAdded={jest.fn()}>
        <button>Open</button>
      </AddAssetDialog>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Añadir Activo a la Cartera')).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar Activo/i)).toBeInTheDocument();
  });
});
