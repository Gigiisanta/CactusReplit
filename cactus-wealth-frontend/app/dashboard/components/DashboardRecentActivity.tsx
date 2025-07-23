'use client';

import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { Notification } from '@/types';

function getStatusColor(status: string) {
  if (status === 'success' || status === 'completed') {
    return 'bg-green-500';
  } else if (status === 'error' || status === 'failed') {
    return 'bg-red-500';
  } else if (status === 'warning' || status === 'pending') {
    return 'bg-yellow-500';
  } else {
    return 'bg-gray-500';
  }
}

export default React.memo(function DashboardRecentActivity() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNotifications(10);
      // Ensure data is always an array
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      setNotifications([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading) {
    return (
      <Card className='card-hover'>
        <CardHeader>
          <CardTitle className='text-cactus-700'>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-gray-300'></div>
                <div className='flex-1 text-sm'>
                  <div className='mb-1 h-4 animate-pulse rounded bg-gray-200'></div>
                  <div className='h-3 w-24 animate-pulse rounded bg-gray-100'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='card-hover border-red-200 bg-red-50'>
        <CardHeader>
          <CardTitle className='text-cactus-700'>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-sm text-red-600'>{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='card-hover'>
      <CardHeader>
        <CardTitle className='text-cactus-700'>Recent Activity</CardTitle>
        <CardDescription>Latest updates and notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {notifications.length === 0 ? (
            <div className='text-center text-sm text-gray-500'>
              No recent activity
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className='flex items-center space-x-3'
              >
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor('info')}`}
                ></div>
                <div className='flex-1 text-sm'>
                  <p className='text-gray-900'>{notification.message}</p>
                  <p className='text-xs text-gray-500'>
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});
