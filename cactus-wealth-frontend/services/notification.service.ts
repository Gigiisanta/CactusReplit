/**
 * 🚀 CLEAN ARCHITECTURE: Notification Service
 * 
 * Centralized service for all notification-related API operations.
 * Components should use this service instead of direct apiClient calls.
 */

import { Notification } from '@/types';
import { apiClient } from '@/lib/api';

export class NotificationService {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(limit: number = 10): Promise<Notification[]> {
    return apiClient.getNotifications(limit);
  }
} 