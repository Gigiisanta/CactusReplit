import { render, screen, waitFor } from '@testing-library/react';
import HistoricalPerformanceChart from '../HistoricalPerformanceChart';
import { AssetType, ModelPortfolioPosition } from '@/types';

const mockApiClient = {
  backtestPortfolio: jest.fn().mockResolvedValue({
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    data_points: [
      {
        date: '2023-01-01',
        portfolio_value: 1000,
        benchmark_values: { SPY: 1000 },
        dividend_events: [],
      },
      {
        date: '2023-12-31',
        portfolio_value: 1200,
        benchmark_values: { SPY: 1300 },
        dividend_events: [],
      },
    ],
    performance_metrics: {
      total_return: 20,
      SPY_total_return: 30,
      vs_SPY: -10,
    },
  }),
};

const mockAsset = {
  id: 1,
  ticker_symbol: 'AAPL',
  name: 'Apple Inc.',
  asset_type: AssetType.STOCK,
  created_at: new Date().toISOString(),
};

const mockPosition: ModelPortfolioPosition = {
  id: 1,
  weight: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  model_portfolio_id: 1,
  asset_id: 1,
  asset: mockAsset,
};

describe('HistoricalPerformanceChart', () => {
  it('renders and fetches data', async () => {
    render(
      <HistoricalPerformanceChart
        portfolioId={1}
        composition={[mockPosition]}
        isComplete={true}
        apiClient={mockApiClient as any}
      />
    );
    await waitFor(() =>
      expect(mockApiClient.backtestPortfolio).toHaveBeenCalled()
    );
    expect(screen.getByText(/Rendimiento Total/i)).toBeInTheDocument();
  });
});
