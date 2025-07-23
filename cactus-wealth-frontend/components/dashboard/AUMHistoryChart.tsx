/**
 * 🚀 INSIGHT ANALYTICS: AUM History Chart Component
 *
 * Interactive time series chart showing Assets Under Management over time.
 * Uses recharts for smooth, responsive visualization with tooltips and loading states.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardService, AUMDataPoint } from '@/services/dashboard.service';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar } from 'lucide-react';

interface AUMHistoryChartProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

// Period options for user selection
const PERIOD_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export function AUMHistoryChart({
  className = '',
  height = 300,
  showControls = true,
}: AUMHistoryChartProps) {
  const [data, setData] = useState<AUMDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    let isMounted = true;

    const fetchAumHistory = async (days: number) => {
      try {
        setLoading(true);
        setError(null);
        const aumData = await DashboardService.getAumHistory(days);

        if (isMounted) {
          setData(aumData);
        }
      } catch (err) {
        console.error('Error fetching AUM history:', err);
        if (isMounted) {
          setError('Failed to load AUM history data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAumHistory(selectedPeriod);

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg'>
          <p className='text-sm font-medium'>{`Date: ${label}`}</p>
          <p className='text-sm text-cactus-700'>
            {`AUM: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Card className={`card-hover ${className}`}>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 text-cactus-700'>
                <TrendingUp className='h-5 w-5' />
                Assets Under Management
              </CardTitle>
              <CardDescription>Historical AUM performance</CardDescription>
            </div>
            {showControls && (
              <div className='flex gap-1'>
                {PERIOD_OPTIONS.map((option) => (
                  <div
                    key={option.days}
                    className='h-8 w-12 animate-pulse rounded bg-gray-200'
                  />
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`w-full animate-pulse rounded bg-gray-100`}
            style={{ height }}
          />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`card-hover ${className}`}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-cactus-700'>
            <TrendingUp className='h-5 w-5' />
            Assets Under Management
          </CardTitle>
          <CardDescription>Historical AUM performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-64 items-center justify-center text-red-500'>
            <div className='text-center'>
              <p className='text-sm font-medium'>Failed to load AUM data</p>
              <p className='mt-1 text-xs'>Please try again later</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-hover ${className}`}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-cactus-700'>
              <TrendingUp className='h-5 w-5' />
              Assets Under Management
            </CardTitle>
            <CardDescription>
              Historical AUM performance over {selectedPeriod} days
            </CardDescription>
          </div>
          {showControls && (
            <div className='flex gap-1'>
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.days}
                  variant={
                    selectedPeriod === option.days ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => handlePeriodChange(option.days)}
                  className='h-8 px-3 text-xs'
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={height}>
          <LineChart data={Array.isArray(data) ? data : []}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='date'
              stroke='#666'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#666'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type='monotone'
              dataKey='value'
              stroke='#059669'
              strokeWidth={2}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
