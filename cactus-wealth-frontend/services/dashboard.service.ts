/**
 * 🚀 CLEAN ARCHITECTURE: Dashboard Service
 *
 * Centralized service for all dashboard-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { DashboardSummaryResponse } from '@/types';
import { apiClient } from '@/lib/api';

// 🚀 INSIGHT ANALYTICS: Type for AUM history data points
export interface AUMDataPoint {
  date: string;
  value: number;
}

export class DashboardService {
  /**
   * Get dashboard summary data with KPIs
   */
  static async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return apiClient.getDashboardSummary();
  }

  /**
   * 🚀 INSIGHT ANALYTICS: Get AUM (Assets Under Management) historical data
   *
   * @param days Number of days to look back (1-365, default: 30)
   * @returns Array of data points for time series visualization
   */
  static async getAumHistory(days: number = 30): Promise<AUMDataPoint[]> {
    return apiClient.getAumHistory(days);
  }
}
