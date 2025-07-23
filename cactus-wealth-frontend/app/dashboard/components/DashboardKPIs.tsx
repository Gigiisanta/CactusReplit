'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Target,
} from 'lucide-react';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardKPIsSkeleton } from './DashboardKPIs.Skeleton';

interface DashboardData {
  total_clients: number;
  assets_under_management: number;
  monthly_growth_percentage: number | null;
  reports_generated_this_quarter: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(percentage: number | null) {
  if (percentage === null) return 'N/A';
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

export default React.memo(function DashboardKPIs() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DashboardService.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Memoize KPIs calculation to avoid unnecessary recalculations
  const kpis = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        title: 'Total Clients',
        value: (dashboardData?.total_clients ?? 0).toString(),
        icon: Users,
        color: 'bg-blue-500',
        description: 'Active clients under management',
      },
      {
        title: 'Monthly Growth',
        value: formatPercentage(dashboardData?.monthly_growth_percentage),
        icon:
          (dashboardData?.monthly_growth_percentage ?? 0) >= 0
            ? TrendingUp
            : TrendingDown,
        color:
          (dashboardData?.monthly_growth_percentage ?? 0) >= 0
            ? 'bg-green-500'
            : 'bg-red-500',
        description: 'Portfolio performance this month',
      },
      {
        title: 'Reports Generated',
        value: (dashboardData?.reports_generated_this_quarter ?? 0).toString(),
        icon: FileText,
        color: 'bg-purple-500',
        description: 'This quarter',
      },
    ];
  }, [dashboardData]);

  if (loading) {
    return <DashboardKPIsSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className='mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
        {error || 'Failed to load KPI data'}
      </div>
    );
  }

  // Additional safety check - ensure dashboardData has required properties
  if (
    typeof dashboardData.total_clients === 'undefined' ||
    typeof dashboardData.reports_generated_this_quarter === 'undefined'
  ) {
    return (
      <div className='mb-4 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700'>
        Dashboard data is incomplete. Please refresh the page or try logging in
        again.
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3'>
      {kpis.map((kpi) => (
        <Card key={kpi.title} className='card-hover'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              {kpi.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${kpi.color}`}>
              <kpi.icon className='h-4 w-4 text-white' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-cactus-700'>
              {kpi.value}
            </div>
            <CardDescription className='text-xs text-gray-500'>
              {kpi.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
