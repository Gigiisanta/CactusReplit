import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ModelPortfolioPosition } from '@/types';

interface BacktestDataPoint {
  date: string;
  portfolio_value: number;
  benchmark_values: Record<string, number>;
  dividend_events: Array<{ ticker: string; amount: number }>;
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
  dividends?: Array<{ ticker: string; amount: number }>;
  [benchmark: string]:
    | number
    | string
    | Array<{ ticker: string; amount: number }>
    | undefined;
}

export function useHistoricalPerformanceChart(props: any) {
  const api = props.apiClient || apiClient;
  const [period, setPeriod] = useState('1y');
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([
    'SPY',
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const memoizedComposition = useMemo(() => {
    const totalWeight = props.composition.reduce(
      (sum: number, pos: ModelPortfolioPosition) => sum + Number(pos.weight),
      0
    );
    if (totalWeight === 0) return [];
    return props.composition.map((pos: ModelPortfolioPosition) => ({
      ticker: pos.asset.ticker_symbol,
      weight: Number(pos.weight) / totalWeight,
    }));
  }, [props.composition]);

  const fetchBacktestData = useCallback(async () => {
    if (!props.composition.length) return;
    setLoading(true);
    try {
      const request = {
        composition: memoizedComposition,
        benchmarks: selectedBenchmarks,
        period: period,
      };
      const response = await api.backtestPortfolio(request);
      setData(response);
      const transformedData: ChartDataPoint[] = response.data_points.map(
        (point: BacktestDataPoint) => {
          const chartPoint: ChartDataPoint = {
            date: point.date,
            portfolio: point.portfolio_value,
            dividends:
              point.dividend_events.length > 0
                ? point.dividend_events
                : undefined,
          };
          Object.entries(point.benchmark_values).forEach(
            ([benchmark, value]) => {
              chartPoint[benchmark] = value;
            }
          );
          return chartPoint;
        }
      );
      setChartData(transformedData);
    } catch (error: any) {
      console.error('Error fetching backtest data:', error);
      toast.error(
        error.message || 'Error al obtener datos de rendimiento histórico'
      );
    } finally {
      setLoading(false);
    }
  }, [
    props.composition.length,
    memoizedComposition,
    selectedBenchmarks,
    period,
    api,
  ]);

  useEffect(() => {
    fetchBacktestData();
  }, [fetchBacktestData]);

  return {
    period,
    setPeriod,
    selectedBenchmarks,
    setSelectedBenchmarks,
    loading,
    data,
    chartData,
    fetchBacktestData,
  };
}
