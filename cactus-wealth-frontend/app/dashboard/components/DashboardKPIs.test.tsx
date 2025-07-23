import { render, screen, waitFor, act } from '@testing-library/react';
import DashboardKPIs from './DashboardKPIs';

jest.mock('@/services/dashboard.service', () => ({
  DashboardService: {
    getDashboardSummary: jest.fn(),
  },
}));

describe('DashboardKPIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(<DashboardKPIs />);
    // Check for skeleton by class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    const { DashboardService } = require('@/services/dashboard.service');
    DashboardService.getDashboardSummary.mockRejectedValueOnce(
      new Error('fail')
    );
    render(<DashboardKPIs />);
    await waitFor(() =>
      expect(
        screen.getByText(/Failed to load dashboard data/i)
      ).toBeInTheDocument()
    );
  });

  it('renders KPIs on success', async () => {
    const { DashboardService } = require('@/services/dashboard.service');
    DashboardService.getDashboardSummary.mockResolvedValueOnce({
      total_clients: 5,
      monthly_growth_percentage: 2.5,
      reports_generated_this_quarter: 3,
    });
    render(<DashboardKPIs />);
    await waitFor(() =>
      expect(screen.getByText(/Total Clients/i)).toBeInTheDocument()
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
