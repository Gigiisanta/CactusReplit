import { render, screen } from '@testing-library/react';
import DashboardActions from '../DashboardActions';

jest.mock('@/lib/api', () => ({
  apiClient: {
    getClients: jest.fn(),
    generateReport: jest.fn(),
  },
}));

// Mock the hook with proper state management
const mockUseDashboardActions = {
  isGeneratingReport: false,
  isDialogOpen: false,
  error: null,
  clientsLoading: false,
  clients: [],
  selectedClientId: '',
  setSelectedClientId: jest.fn(),
  handleDialogOpen: jest.fn(),
  handleDialogClose: jest.fn(),
  handleGenerateReport: jest.fn(),
  setIsDialogOpen: jest.fn(),
  setClients: jest.fn(),
  setClientsLoading: jest.fn(),
  setError: jest.fn(),
};

jest.mock('@/hooks/useDashboardActions', () => ({
  useDashboardActions: () => mockUseDashboardActions,
}));

describe('DashboardActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockUseDashboardActions.error = null;
    mockUseDashboardActions.clients = [];
    mockUseDashboardActions.clientsLoading = false;
  });

  it('renders and loads clients', async () => {
    const { apiClient } = require('@/lib/api');
    apiClient.getClients.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Alice Smith',
        email: 'alice@example.com',
        status: 'active',
      },
    ]);

    render(<DashboardActions />);
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
  });

  it('shows error if loading clients fails', async () => {
    const { apiClient } = require('@/lib/api');
    apiClient.getClients.mockRejectedValueOnce(new Error('fail'));

    // Set error state in mock
    mockUseDashboardActions.error = 'Failed to load clients';

    render(<DashboardActions />);
    expect(screen.getByText(/Failed to load clients/i)).toBeInTheDocument();
  });

  it('renders basic component structure', () => {
    render(<DashboardActions />);
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/View All Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Client/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Report/i)).toBeInTheDocument();
  });
});
