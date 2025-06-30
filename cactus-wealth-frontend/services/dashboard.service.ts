/**
 * 🚀 CLEAN ARCHITECTURE: Dashboard Service
 * 
 * Centralized service for all dashboard-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { DashboardSummaryResponse } from '@/types';
import { apiClient } from '@/lib/api';

export class DashboardService {
  /**
   * Get dashboard summary data with KPIs
   */
  static async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return apiClient.getDashboardSummary();
  }
} 