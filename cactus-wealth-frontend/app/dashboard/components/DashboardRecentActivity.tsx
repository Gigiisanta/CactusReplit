'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { Notification } from '@/types';

function getRelativeTime(date: string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMs = now.getTime() - notificationDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

function getNotificationColor(message: string): string {
  if (message.includes('cliente añadido') || message.includes('Nuevo cliente')) {
    return 'bg-blue-500';
  } else if (message.includes('reporte') || message.includes('generado')) {
    return 'bg-cactus-500';
  } else if (message.includes('valoración') || message.includes('Valoración')) {
    return 'bg-green-500';
  } else {
    return 'bg-gray-500';
  }
}

export default function DashboardRecentActivity() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getNotifications(10);
        setNotifications(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

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
                <div className='h-2 w-2 rounded-full bg-gray-300 animate-pulse'></div>
                <div className='text-sm flex-1'>
                  <div className='h-4 bg-gray-200 rounded animate-pulse mb-1'></div>
                  <div className='h-3 bg-gray-100 rounded animate-pulse w-24'></div>
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
      <Card className='card-hover'>
        <CardHeader>
          <CardTitle className='text-cactus-700'>Recent Activity</CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center py-4'>
            <p className='text-red-600 text-sm'>{error}</p>
          </div>
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
            <div className='text-center py-4'>
              <p className='text-gray-500 text-sm'>No recent activity</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className='flex items-center space-x-3'>
                <div className={`h-2 w-2 rounded-full ${getNotificationColor(notification.message)}`}></div>
                <div className='text-sm flex-1'>
                  <p className='font-medium'>{notification.message}</p>
                  <p className='text-gray-500'>{getRelativeTime(notification.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 