/**
 * 🚀 CLEAN ARCHITECTURE: Centralized API Service Layer
 *
 * This module exports all service classes that provide clean,
 * business-focused methods for API access. Components should
 * use these services instead of directly calling apiClient.
 */

export { ClientService } from './client.service';
export { PortfolioService } from './portfolio.service';
export { DashboardService } from './dashboard.service';
export { AuthService } from './auth.service';
export { NotificationService } from './notification.service';
