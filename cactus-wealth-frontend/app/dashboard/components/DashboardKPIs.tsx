'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DashboardKPIsSkeleton } from './DashboardKPIs.Skeleton';

interface DashboardData {
  total_clients: number;
  assets_under_management: number;
  monthly_growth_percentage: number | null;
  reports_generated_this_quarter: number;
}

function formatCurrency(amount: number) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatPercentage(percentage: number | null) {
  if (percentage === null) {
    return 'N/A';
  }
  const percentageValue = percentage * 100; // Convert decimal to percentage
  const sign = percentageValue >= 0 ? '+' : '';
  return `${sign}${percentageValue.toFixed(1)}%`;
}

export default function DashboardKPIs() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardKPIsSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error || 'Failed to load KPI data'}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
      <Card className='card-hover'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-cactus-600'>
            {dashboardData.total_clients || 0}
          </div>
          <p className='text-xs text-muted-foreground'>
            Active advisory relationships
          </p>
        </CardContent>
      </Card>

      <Card className='card-hover'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Assets Under Management
          </CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-cactus-600'>
            {formatCurrency(dashboardData.assets_under_management || 0)}
          </div>
          <p className='text-xs text-muted-foreground'>
            Total client portfolio value
          </p>
        </CardContent>
      </Card>

      <Card className='card-hover'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Monthly Growth
          </CardTitle>
          <TrendingUp className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            dashboardData.monthly_growth_percentage === null 
              ? 'text-gray-500' 
              : dashboardData.monthly_growth_percentage >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
          }`}>
            {formatPercentage(dashboardData.monthly_growth_percentage)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {dashboardData.monthly_growth_percentage === null 
              ? 'Calculation in progress' 
              : 'Portfolio performance this month'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 