import { PortfolioService } from '@/services/portfolio.service';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getPortfolioValuation: jest.fn(),
    downloadPortfolioReport: jest.fn(),
    generateReport: jest.fn(),
    getModelPortfolios: jest.fn(),
    getModelPortfolio: jest.fn(),
    createModelPortfolio: jest.fn(),
    updateModelPortfolio: jest.fn(),
    deleteModelPortfolio: jest.fn(),
    addModelPortfolioPosition: jest.fn(),
    updateModelPortfolioPosition: jest.fn(),
    deleteModelPortfolioPosition: jest.fn(),
    searchAssets: jest.fn(),
    backtestPortfolio: jest.fn(),
  },
}));

describe('PortfolioService', () => {
  const { apiClient } = require('@/lib/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPortfolioValuation', () => {
    it('should call apiClient.getPortfolioValuation with correct parameters', async () => {
      const mockValuation = { portfolio_id: 1, total_value: 100000 };
      apiClient.getPortfolioValuation.mockResolvedValue(mockValuation);

      const result = await PortfolioService.getPortfolioValuation(1);

      expect(apiClient.getPortfolioValuation).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockValuation);
    });
  });

  describe('downloadPortfolioReport', () => {
    it('should call apiClient.downloadPortfolioReport with correct parameters', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      apiClient.downloadPortfolioReport.mockResolvedValue(mockBlob);

      const result = await PortfolioService.downloadPortfolioReport(1);

      expect(apiClient.downloadPortfolioReport).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBlob);
    });
  });

  describe('generateReport', () => {
    it('should call apiClient.generateReport with correct parameters', async () => {
      const mockResponse = { report_id: '123', status: 'completed' };
      apiClient.generateReport.mockResolvedValue(mockResponse);

      const result = await PortfolioService.generateReport(
        1,
        'PORTFOLIO_SUMMARY'
      );

      expect(apiClient.generateReport).toHaveBeenCalledWith(
        1,
        'PORTFOLIO_SUMMARY'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use default report type when not provided', async () => {
      const mockResponse = { report_id: '123', status: 'completed' };
      apiClient.generateReport.mockResolvedValue(mockResponse);

      await PortfolioService.generateReport(1);

      expect(apiClient.generateReport).toHaveBeenCalledWith(
        1,
        'PORTFOLIO_SUMMARY'
      );
    });
  });

  describe('getModelPortfolios', () => {
    it('should call apiClient.getModelPortfolios', async () => {
      const mockPortfolios = [
        { id: 1, name: 'Conservative', risk_profile: 'LOW' },
        { id: 2, name: 'Aggressive', risk_profile: 'HIGH' },
      ];
      apiClient.getModelPortfolios.mockResolvedValue(mockPortfolios);

      const result = await PortfolioService.getModelPortfolios();

      expect(apiClient.getModelPortfolios).toHaveBeenCalled();
      expect(result).toEqual(mockPortfolios);
    });
  });

  describe('getModelPortfolio', () => {
    it('should call apiClient.getModelPortfolio with correct parameters', async () => {
      const mockPortfolio = {
        id: 1,
        name: 'Conservative',
        risk_profile: 'LOW',
      };
      apiClient.getModelPortfolio.mockResolvedValue(mockPortfolio);

      const result = await PortfolioService.getModelPortfolio(1);

      expect(apiClient.getModelPortfolio).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('createModelPortfolio', () => {
    it('should call apiClient.createModelPortfolio with correct parameters', async () => {
      const portfolioData = {
        name: 'Test Portfolio',
        description: 'Test Description',
        risk_profile: 'MEDIUM' as const,
      };
      const mockPortfolio = { id: 1, ...portfolioData };
      apiClient.createModelPortfolio.mockResolvedValue(mockPortfolio);

      const result = await PortfolioService.createModelPortfolio(portfolioData);

      expect(apiClient.createModelPortfolio).toHaveBeenCalledWith(
        portfolioData
      );
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('updateModelPortfolio', () => {
    it('should call apiClient.updateModelPortfolio with correct parameters', async () => {
      const portfolioData = {
        name: 'Updated Portfolio',
        risk_profile: 'HIGH' as const,
      };
      const mockPortfolio = { id: 1, ...portfolioData };
      apiClient.updateModelPortfolio.mockResolvedValue(mockPortfolio);

      const result = await PortfolioService.updateModelPortfolio(
        1,
        portfolioData
      );

      expect(apiClient.updateModelPortfolio).toHaveBeenCalledWith(
        1,
        portfolioData
      );
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('deleteModelPortfolio', () => {
    it('should call apiClient.deleteModelPortfolio with correct parameters', async () => {
      const mockPortfolio = { id: 1, name: 'Deleted Portfolio' };
      apiClient.deleteModelPortfolio.mockResolvedValue(mockPortfolio);

      const result = await PortfolioService.deleteModelPortfolio(1);

      expect(apiClient.deleteModelPortfolio).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('addModelPortfolioPosition', () => {
    it('should call apiClient.addModelPortfolioPosition with correct parameters', async () => {
      const positionData = {
        asset_id: 1,
        weight: 0.5,
      };
      const mockPosition = { id: 1, ...positionData };
      apiClient.addModelPortfolioPosition.mockResolvedValue(mockPosition);

      const result = await PortfolioService.addModelPortfolioPosition(
        1,
        positionData
      );

      expect(apiClient.addModelPortfolioPosition).toHaveBeenCalledWith(
        1,
        positionData
      );
      expect(result).toEqual(mockPosition);
    });
  });

  describe('updateModelPortfolioPosition', () => {
    it('should call apiClient.updateModelPortfolioPosition with correct parameters', async () => {
      const positionData = {
        weight: 0.6,
      };
      const mockPosition = { id: 1, asset_id: 1, ...positionData };
      apiClient.updateModelPortfolioPosition.mockResolvedValue(mockPosition);

      const result = await PortfolioService.updateModelPortfolioPosition(
        1,
        1,
        positionData
      );

      expect(apiClient.updateModelPortfolioPosition).toHaveBeenCalledWith(
        1,
        1,
        positionData
      );
      expect(result).toEqual(mockPosition);
    });
  });

  describe('deleteModelPortfolioPosition', () => {
    it('should call apiClient.deleteModelPortfolioPosition with correct parameters', async () => {
      const mockPosition = { id: 1, asset_id: 1, weight: 0.5 };
      apiClient.deleteModelPortfolioPosition.mockResolvedValue(mockPosition);

      const result = await PortfolioService.deleteModelPortfolioPosition(1, 1);

      expect(apiClient.deleteModelPortfolioPosition).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockPosition);
    });
  });

  describe('searchAssets', () => {
    it('should call apiClient.searchAssets with correct parameters', async () => {
      const mockAssets = [
        { id: 1, ticker: 'AAPL', name: 'Apple Inc.' },
        { id: 2, ticker: 'GOOGL', name: 'Alphabet Inc.' },
      ];
      apiClient.searchAssets.mockResolvedValue(mockAssets);

      const result = await PortfolioService.searchAssets('AAPL', 10);

      expect(apiClient.searchAssets).toHaveBeenCalledWith('AAPL', 10);
      expect(result).toEqual(mockAssets);
    });

    it('should use default limit when not provided', async () => {
      const mockAssets = [{ id: 1, ticker: 'AAPL', name: 'Apple Inc.' }];
      apiClient.searchAssets.mockResolvedValue(mockAssets);

      await PortfolioService.searchAssets('AAPL');

      expect(apiClient.searchAssets).toHaveBeenCalledWith('AAPL', 10);
    });
  });

  describe('backtestPortfolio', () => {
    it('should call apiClient.backtestPortfolio with correct parameters', async () => {
      const request = {
        composition: [
          { ticker: 'AAPL', weight: 0.5 },
          { ticker: 'GOOGL', weight: 0.5 },
        ],
        benchmarks: ['SPY'],
        period: '1Y',
      };
      const mockResponse = {
        start_date: '2023-01-01',
        end_date: '2024-01-01',
        portfolio_composition: request.composition,
        benchmarks: request.benchmarks,
        data_points: [],
        performance_metrics: { sharpe_ratio: 1.2, total_return: 0.15 },
      };
      apiClient.backtestPortfolio.mockResolvedValue(mockResponse);

      const result = await PortfolioService.backtestPortfolio(request);

      expect(apiClient.backtestPortfolio).toHaveBeenCalledWith(request);
      expect(result).toEqual(mockResponse);
    });
  });
});
