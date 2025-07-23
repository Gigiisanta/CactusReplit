/**
 * 🚀 CLEAN ARCHITECTURE: Portfolio Service
 *
 * Centralized service for all portfolio-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { PortfolioValuation, ReportGenerationResponse } from '@/types';
import { apiClient } from '@/lib/api';

export class PortfolioService {
  /**
   * Get portfolio valuation data
   */
  static async getPortfolioValuation(
    portfolioId: number
  ): Promise<PortfolioValuation> {
    return apiClient.getPortfolioValuation(portfolioId);
  }

  /**
   * Download portfolio report as PDF
   */
  static async downloadPortfolioReport(portfolioId: number): Promise<Blob> {
    return apiClient.downloadPortfolioReport(portfolioId);
  }

  /**
   * Generate portfolio report for a client
   */
  static async generateReport(
    clientId: number,
    reportType: string = 'PORTFOLIO_SUMMARY'
  ): Promise<ReportGenerationResponse> {
    return apiClient.generateReport(clientId, reportType);
  }

  /**
   * Model Portfolio Operations
   */
  static async getModelPortfolios(): Promise<any[]> {
    return apiClient.getModelPortfolios();
  }

  static async getModelPortfolio(portfolioId: number): Promise<any> {
    return apiClient.getModelPortfolio(portfolioId);
  }

  static async createModelPortfolio(portfolioData: {
    name: string;
    description?: string;
    risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<any> {
    return apiClient.createModelPortfolio(portfolioData);
  }

  static async updateModelPortfolio(
    portfolioId: number,
    portfolioData: {
      name?: string;
      description?: string;
      risk_profile?: 'LOW' | 'MEDIUM' | 'HIGH';
    }
  ): Promise<any> {
    return apiClient.updateModelPortfolio(portfolioId, portfolioData);
  }

  static async deleteModelPortfolio(portfolioId: number): Promise<any> {
    return apiClient.deleteModelPortfolio(portfolioId);
  }

  /**
   * Model Portfolio Position Operations
   */
  static async addModelPortfolioPosition(
    portfolioId: number,
    positionData: {
      asset_id: number;
      weight: number;
    }
  ): Promise<any> {
    return apiClient.addModelPortfolioPosition(portfolioId, positionData);
  }

  static async updateModelPortfolioPosition(
    portfolioId: number,
    positionId: number,
    positionData: {
      weight?: number;
    }
  ): Promise<any> {
    return apiClient.updateModelPortfolioPosition(
      portfolioId,
      positionId,
      positionData
    );
  }

  static async deleteModelPortfolioPosition(
    portfolioId: number,
    positionId: number
  ): Promise<any> {
    return apiClient.deleteModelPortfolioPosition(portfolioId, positionId);
  }

  /**
   * Asset Search for Portfolio Management
   */
  static async searchAssets(query: string, limit: number = 10): Promise<any[]> {
    return apiClient.searchAssets(query, limit);
  }

  /**
   * Portfolio Backtesting
   */
  static async backtestPortfolio(request: {
    composition: Array<{
      ticker: string;
      weight: number;
    }>;
    benchmarks: string[];
    period: string;
  }): Promise<{
    start_date: string;
    end_date: string;
    portfolio_composition: Array<{
      ticker: string;
      weight: number;
    }>;
    benchmarks: string[];
    data_points: Array<{
      date: string;
      portfolio_value: number;
      benchmark_values: Record<string, number>;
      dividend_events: Array<{
        ticker: string;
        amount: number;
      }>;
    }>;
    performance_metrics: Record<string, number>;
  }> {
    return apiClient.backtestPortfolio(request);
  }
}
