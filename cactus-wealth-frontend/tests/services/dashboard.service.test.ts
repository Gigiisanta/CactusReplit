import { DashboardService } from '@/services/dashboard.service';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getDashboardSummary: jest.fn(),
    getAumHistory: jest.fn(),
  },
}));

describe('DashboardService', () => {
  const { apiClient } = require('@/lib/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('should call apiClient.getDashboardSummary and return summary', async () => {
      const mockSummary = {
        total_clients: 100,
        total_aum: 5000000,
        active_investors: 75,
        active_insured: 25,
        recent_activities: [
          {
            id: 1,
            type: 'CLIENT_CREATED',
            description: 'New client added',
            created_at: '2023-01-01T00:00:00Z',
          },
        ],
      };
      apiClient.getDashboardSummary.mockResolvedValue(mockSummary);

      const result = await DashboardService.getDashboardSummary();

      expect(apiClient.getDashboardSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      apiClient.getDashboardSummary.mockRejectedValue(error);

      await expect(DashboardService.getDashboardSummary()).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('getAumHistory', () => {
    it('should call apiClient.getAumHistory with default days parameter', async () => {
      const mockHistory = [
        { date: '2023-01-01', value: 5000000 },
        { date: '2023-01-02', value: 5100000 },
      ];
      apiClient.getAumHistory.mockResolvedValue(mockHistory);

      const result = await DashboardService.getAumHistory();

      expect(apiClient.getAumHistory).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockHistory);
    });

    it('should call apiClient.getAumHistory with custom days parameter', async () => {
      const mockHistory = [
        { date: '2023-01-01', value: 5000000 },
        { date: '2023-01-02', value: 5100000 },
      ];
      apiClient.getAumHistory.mockResolvedValue(mockHistory);

      const result = await DashboardService.getAumHistory(7);

      expect(apiClient.getAumHistory).toHaveBeenCalledWith(7);
      expect(result).toEqual(mockHistory);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      apiClient.getAumHistory.mockRejectedValue(error);

      await expect(DashboardService.getAumHistory()).rejects.toThrow(
        'API Error'
      );
    });

    it('should handle empty history data', async () => {
      const mockHistory: Array<{ date: string; value: number }> = [];
      apiClient.getAumHistory.mockResolvedValue(mockHistory);

      const result = await DashboardService.getAumHistory();

      expect(apiClient.getAumHistory).toHaveBeenCalledWith(30);
      expect(result).toEqual([]);
    });

    it('should handle single day history', async () => {
      const mockHistory = [{ date: '2023-01-01', value: 5000000 }];
      apiClient.getAumHistory.mockResolvedValue(mockHistory);

      const result = await DashboardService.getAumHistory(1);

      expect(apiClient.getAumHistory).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockHistory);
    });

    it('should handle large number of days', async () => {
      const mockHistory = [
        { date: '2022-01-01', value: 4000000 },
        { date: '2023-01-01', value: 5000000 },
      ];
      apiClient.getAumHistory.mockResolvedValue(mockHistory);

      const result = await DashboardService.getAumHistory(365);

      expect(apiClient.getAumHistory).toHaveBeenCalledWith(365);
      expect(result).toEqual(mockHistory);
    });
  });
});
