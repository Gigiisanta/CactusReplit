'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButtons } from './ActionButtons';
import { apiClientInterceptor } from '@/lib/apiClient';
import { format } from 'date-fns';
import { RefreshCw, Zap, Clock, AlertCircle } from 'lucide-react';

interface AutomationStatus {
  healthy: boolean;
  queue: number;
  lastSync: string;
}

export function AutomationDashboard() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClientInterceptor
        .getClient()
        .get<AutomationStatus>('/automations/status');
      setStatus(response.data);
    } catch (err) {
      console.error('Error fetching automation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatLastSync = (lastSync: string) => {
    try {
      return format(new Date(lastSync), 'dd MMM HH:mm');
    } catch {
      return 'Never';
    }
  };

  if (isLoading && !status) {
    return (
      <Card>
        <CardContent className='flex h-48 items-center justify-center'>
          <RefreshCw className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='flex h-48 items-center justify-center'>
          <div className='space-y-2 text-center'>
            <AlertCircle className='mx-auto h-8 w-8 text-destructive' />
            <p className='text-sm text-muted-foreground'>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>System Status</CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <Badge variant={status?.healthy ? 'default' : 'destructive'}>
              {status?.healthy ? 'Healthy' : 'Down'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Queue Count</CardTitle>
            <RefreshCw className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{status?.queue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Last Sync</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {status?.lastSync ? formatLastSync(status.lastSync) : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionButtons onStatusChange={fetchStatus} />
        </CardContent>
      </Card>
    </div>
  );
}
