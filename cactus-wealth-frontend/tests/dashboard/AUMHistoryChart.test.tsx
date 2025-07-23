import { render, screen, waitFor } from '@testing-library/react';
import { AUMHistoryChart } from '@/components/dashboard/AUMHistoryChart';

jest.mock('@/services/dashboard.service', () => ({
  DashboardService: {
    getAumHistory: jest.fn(),
  },
}));

describe('AUMHistoryChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(<AUMHistoryChart height={400} />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    const { DashboardService } = require('@/services/dashboard.service');
    (DashboardService.getAumHistory as jest.Mock).mockRejectedValueOnce(
      new Error('fail')
    );
    render(<AUMHistoryChart height={400} />);
    await waitFor(() =>
      expect(screen.getByText(/Failed to load AUM data/i)).toBeInTheDocument()
    );
  });

  it('renders chart with data', async () => {
    const { DashboardService } = require('@/services/dashboard.service');
    (DashboardService.getAumHistory as jest.Mock).mockResolvedValueOnce([
      { date: '2024-01-01', value: 100000 },
      { date: '2024-02-01', value: 120000 },
    ]);
    render(<AUMHistoryChart height={400} />);
    await waitFor(() =>
      expect(screen.getByText(/Assets Under Management/i)).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        document.querySelector('.recharts-responsive-container')
      ).toBeInTheDocument()
    );
  });
});
