'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { ModelPortfolioPosition } from '@/types';
import { useHistoricalPerformanceChart } from '@/hooks/useHistoricalPerformanceChart';

interface HistoricalPerformanceChartProps {
  portfolioId: number;
  composition: ModelPortfolioPosition[];
  isComplete: boolean;
  apiClient?: typeof import('@/lib/api').apiClient;
}

interface BacktestDataPoint {
  date: string;
  portfolio_value: number;
  benchmark_values: Record<string, number>;
  dividend_events: Array<{
    ticker: string;
    amount: number;
  }>;
}

interface BacktestResponse {
  start_date: string;
  end_date: string;
  data_points: BacktestDataPoint[];
  performance_metrics: Record<string, number>;
}

interface ChartDataPoint {
  date: string;
  portfolio: number;
  dividends?: Array<{
    ticker: string;
    amount: number;
  }>;
  [benchmark: string]:
    | number
    | string
    | Array<{ ticker: string; amount: number }>
    | undefined;
}

const PERIOD_OPTIONS = [
  { value: '1mo', label: '1 Mes' },
  { value: '3mo', label: '3 Meses' },
  { value: '6mo', label: '6 Meses' },
  { value: '1y', label: '1 Año' },
  { value: '2y', label: '2 Años' },
  { value: '5y', label: '5 Años' },
];

const BENCHMARK_OPTIONS = [
  { value: 'SPY', label: 'S&P 500 (SPY)', color: '#dc2626' },
  { value: 'QQQ', label: 'NASDAQ-100 (QQQ)', color: '#2563eb' },
  { value: 'VTI', label: 'Total Stock Market (VTI)', color: '#16a34a' },
  { value: 'BND', label: 'Total Bond Market (BND)', color: '#ca8a04' },
];

const COLORS = {
  portfolio: '#5cb35c',
  SPY: '#dc2626',
  QQQ: '#2563eb',
  VTI: '#16a34a',
  BND: '#ca8a04',
};

export default function HistoricalPerformanceChart(
  props: HistoricalPerformanceChartProps
) {
  const {
    period,
    setPeriod,
    selectedBenchmarks,
    setSelectedBenchmarks,
    loading,
    data,
    chartData,
    fetchBacktestData,
  } = useHistoricalPerformanceChart(props);

  const handleBenchmarkChange = (benchmark: string, checked: boolean) => {
    if (checked) {
      setSelectedBenchmarks((prev) => [...prev, benchmark]);
    } else {
      setSelectedBenchmarks((prev) => prev.filter((b) => b !== benchmark));
    }
  };

  const formatPercentage = (value: number) => {
    return `${((value / 100 - 1) * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(0)}`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = Array.isArray(chartData)
        ? chartData.find((d) => d.date === label)
        : null;

      return (
        <div className='rounded-lg border border-sage-200 bg-white p-3 shadow-lg'>
          <p className='mb-2 font-medium text-sage-900'>{label}</p>
          {payload.map((entry: any) => (
            <p
              key={entry.dataKey}
              className='text-sm'
              style={{ color: entry.color }}
            >
              {entry.dataKey === 'portfolio' ? 'Cartera' : entry.dataKey}:{' '}
              {formatCurrency(entry.value)}
              <span className='ml-2 text-xs text-sage-600'>
                ({formatPercentage(entry.value)})
              </span>
            </p>
          ))}
          {dataPoint?.dividends && dataPoint.dividends.length > 0 && (
            <div className='mt-2 border-t border-sage-200 pt-2'>
              <p className='text-xs font-medium text-sage-600'>Dividendos:</p>
              {dataPoint.dividends.map((div, idx) => (
                <p key={idx} className='text-xs text-cactus-600'>
                  {div.ticker}: ${div.amount.toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Performance metrics display
  const renderPerformanceMetrics = () => {
    if (!data?.performance_metrics) return null;

    const metrics = data.performance_metrics;
    const portfolioReturn = metrics.total_return || 0;
    const spyReturn = metrics.SPY_total_return || 0;
    const vsSpyReturn = metrics.vs_SPY || 0;

    return (
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <div className='rounded-lg bg-cactus-50 p-4'>
          <div className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-cactus-600' />
            <span className='text-sm font-medium text-sage-700'>
              Rendimiento Total
            </span>
          </div>
          <p className='mt-1 text-xl font-bold text-sage-900'>
            {(portfolioReturn * 100).toFixed(1)}%
          </p>
        </div>

        <div className='rounded-lg bg-sage-50 p-4'>
          <div className='flex items-center space-x-2'>
            <BarChart3 className='h-5 w-5 text-sage-600' />
            <span className='text-sm font-medium text-sage-700'>
              Volatilidad
            </span>
          </div>
          <p className='mt-1 text-xl font-bold text-sage-900'>
            {((metrics.annualized_volatility || 0) * 100).toFixed(1)}%
          </p>
        </div>

        <div className='rounded-lg bg-sand-50 p-4'>
          <div className='flex items-center space-x-2'>
            <TrendingDown className='h-5 w-5 text-sand-600' />
            <span className='text-sm font-medium text-sage-700'>
              Ratio Sharpe
            </span>
          </div>
          <p className='mt-1 text-xl font-bold text-sage-900'>
            {(metrics.sharpe_ratio || 0).toFixed(2)}
          </p>
        </div>

        <div
          className={`rounded-lg p-4 ${vsSpyReturn >= 0 ? 'bg-cactus-50' : 'bg-red-50'}`}
        >
          <div className='flex items-center space-x-2'>
            <DollarSign
              className={`h-5 w-5 ${vsSpyReturn >= 0 ? 'text-cactus-600' : 'text-red-600'}`}
            />
            <span className='text-sm font-medium text-sage-700'>
              vs S&P 500
            </span>
          </div>
          <p
            className={`mt-1 text-xl font-bold ${vsSpyReturn >= 0 ? 'text-cactus-800' : 'text-red-800'}`}
          >
            {vsSpyReturn >= 0 ? '+' : ''}
            {(vsSpyReturn * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className='border-cactus-200'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center space-x-2 text-xl text-sage-900'>
              <TrendingUp className='h-6 w-6 text-cactus-600' />
              <span>Análisis de Rendimiento Histórico</span>
            </CardTitle>
            <CardDescription>
              Backtesting dinámico con datos de mercado reales y comparación con
              benchmarks
            </CardDescription>
          </div>
          {!props.isComplete && (
            <Badge
              variant='outline'
              className='border-amber-200 text-amber-700'
            >
              Portfolio Incompleto
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {props.composition.length === 0 ? (
          <div className='py-12 text-center text-sage-500'>
            <TrendingUp className='mx-auto mb-4 h-16 w-16 text-sage-300' />
            <h3 className='mb-2 text-lg font-medium'>
              Sin activos para analizar
            </h3>
            <p className='text-sm'>
              Añada activos a la cartera para ver el análisis de rendimiento
              histórico
            </p>
          </div>
        ) : (
          <>
            {/* Controls Section */}
            <div className='flex flex-wrap items-center gap-4 rounded-lg bg-sage-50 p-4'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm font-medium text-sage-700'>
                  Período:
                </span>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center space-x-4'>
                <span className='text-sm font-medium text-sage-700'>
                  Benchmarks:
                </span>
                {BENCHMARK_OPTIONS.map((benchmark) => (
                  <div
                    key={benchmark.value}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      id={benchmark.value}
                      checked={selectedBenchmarks.includes(benchmark.value)}
                      onCheckedChange={(checked) =>
                        handleBenchmarkChange(
                          benchmark.value,
                          checked as boolean
                        )
                      }
                    />
                    <label
                      htmlFor={benchmark.value}
                      className='cursor-pointer text-sm text-sage-700'
                    >
                      {benchmark.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            {data && !loading && renderPerformanceMetrics()}

            {/* Chart Section */}
            <div className='rounded-lg border border-sage-200 bg-white p-6'>
              {loading ? (
                <div className='flex h-96 items-center justify-center'>
                  <div className='text-center'>
                    <BarChart3 className='mx-auto mb-4 h-12 w-12 animate-pulse text-cactus-400' />
                    <p className='text-sage-600'>
                      Calculando rendimiento histórico...
                    </p>
                  </div>
                </div>
              ) : Array.isArray(chartData) && chartData.length > 0 ? (
                <ResponsiveContainer width='100%' height={400}>
                  <LineChart data={Array.isArray(chartData) ? chartData : []}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                    <XAxis
                      dataKey='date'
                      stroke='#6b7280'
                      fontSize={12}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis
                      stroke='#6b7280'
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    {/* Portfolio Line */}
                    <Line
                      type='monotone'
                      dataKey='portfolio'
                      stroke={COLORS.portfolio}
                      strokeWidth={3}
                      dot={false}
                      name='Cartera'
                      connectNulls
                    />

                    {/* Benchmark Lines */}
                    {selectedBenchmarks.map((benchmark) => (
                      <Line
                        key={benchmark}
                        type='monotone'
                        dataKey={benchmark}
                        stroke={COLORS[benchmark as keyof typeof COLORS]}
                        strokeWidth={2}
                        dot={false}
                        name={benchmark}
                        strokeDasharray='5 5'
                        connectNulls
                      />
                    ))}

                    {/* Dividend Events */}
                    {Array.isArray(chartData) &&
                      chartData.map((point, index) =>
                        point.dividends?.map((dividend, divIndex) => (
                          <ReferenceDot
                            key={`${index}-${divIndex}`}
                            x={point.date}
                            y={point.portfolio}
                            r={4}
                            fill='#f59e0b'
                            stroke='#d97706'
                            strokeWidth={2}
                          />
                        ))
                      )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className='py-12 text-center text-sage-500'>
                  <BarChart3 className='mx-auto mb-4 h-12 w-12' />
                  <p>No hay datos disponibles para el período seleccionado</p>
                </div>
              )}
            </div>

            {/* Data Summary */}
            {data && !loading && (
              <div className='text-center text-xs text-sage-500'>
                Período: {data.start_date} - {data.end_date} • Datos
                actualizados en tiempo real via Yahoo Finance • Puntos amarillos
                indican eventos de dividendos
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
