'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  PieChart,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import {
  ModelPortfolio,
  ModelPortfolioPosition,
  AssetAllocationData,
  SectorAllocationData,
  RiskProfile,
} from '@/types';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CACTUS_CHART_COLORS,
  getSectorColor,
  getChartColor,
} from '@/lib/chart-colors';
import AddAssetDialog from './components/AddAssetDialog';
import HistoricalPerformanceChart from './components/HistoricalPerformanceChart';
import { usePortfolioData, usePortfolioUpdate } from '@/hooks/usePortfolio';

const riskProfileLabels = {
  LOW: 'Conservador',
  MEDIUM: 'Moderado',
  HIGH: 'Agresivo',
};

const riskProfileColors = {
  LOW: 'bg-cactus-100 text-cactus-800',
  MEDIUM: 'bg-sand-100 text-sand-800',
  HIGH: 'bg-sage-100 text-sage-800',
};

export default function AssetManagementPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);

  const { portfolio, loading, fetchPortfolio } = usePortfolioData(
    portfolioId,
    router
  );
  const {
    editingRowId,
    currentEditValue,
    isUpdating,
    handleEditPosition,
    handleConfirmEdit,
    setEditingRowId,
    setCurrentEditValue,
    setIsUpdating,
  } = usePortfolioUpdate(portfolioId, fetchPortfolio);

  const handleUpdatePosition = async (
    position: ModelPortfolioPosition,
    newWeight: number
  ) => {
    const weight = newWeight / 100; // Convert percentage to decimal
    if (weight <= 0 || weight > 1) {
      toast.error('La ponderación debe estar entre 0.1% y 100%');
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.updateModelPortfolioPosition(portfolioId, position.id, {
        weight: weight,
      });

      toast.success('Ponderación actualizada');
      setEditingRowId(null);
      fetchPortfolio();
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error(error.message || 'Error al actualizar la ponderación');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePosition = async (position: ModelPortfolioPosition) => {
    if (
      !confirm(
        `¿Está seguro de eliminar ${position.asset.ticker_symbol} de la cartera?`
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteModelPortfolioPosition(portfolioId, position.id);
      toast.success('Activo eliminado de la cartera');
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Error al eliminar el activo');
    }
  };

  // Calculate data for charts with new color palette
  const getAssetAllocationData = (): AssetAllocationData[] => {
    if (!portfolio || !portfolio.positions) return [];

    return portfolio.positions.map((position, index) => ({
      name: position.asset.name,
      value: Number(position.weight) * 100,
      ticker: position.asset.ticker_symbol,
      color: getChartColor(index),
    }));
  };

  const getSectorAllocationData = (): SectorAllocationData[] => {
    if (!portfolio || !portfolio.positions) return [];

    const sectorMap = new Map<string, { value: number; assets: string[] }>();

    portfolio.positions.forEach((position) => {
      const sector = position.asset.sector || 'Sin Clasificar';
      const weight = Number(position.weight) * 100;

      if (sectorMap.has(sector)) {
        const existing = sectorMap.get(sector)!;
        existing.value += weight;
        existing.assets.push(position.asset.ticker_symbol);
      } else {
        sectorMap.set(sector, {
          value: weight,
          assets: [position.asset.ticker_symbol],
        });
      }
    });

    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
      name: sector,
      value: data.value,
      assets: data.assets,
      color: getSectorColor(sector),
    }));
  };

  const calculateTotalWeight = () => {
    if (!portfolio || !portfolio.positions) return 0;
    return (
      portfolio.positions.reduce(
        (total, position) => total + Number(position.weight),
        0
      ) * 100
    );
  };

  if (loading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <PieChart className='mx-auto mb-4 h-12 w-12 animate-spin text-cactus-400' />
            <p className='text-sage-600'>Cargando estudio de gestión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className='container mx-auto py-8'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-red-600'>
            Cartera no encontrada
          </h1>
          <Button onClick={() => router.push('/portfolios')}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver a Carteras
          </Button>
        </div>
      </div>
    );
  }

  const assetData = getAssetAllocationData();
  const sectorData = getSectorAllocationData();
  const totalWeight = calculateTotalWeight();
  const isComplete = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className='space-y-8 py-8'>
      {/* Clean Page Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' onClick={() => router.push('/portfolios')}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-sage-900'>
              Estudio de Gestión: {portfolio.name}
            </h1>
            <p className='mt-1 text-sage-600'>
              Dashboard avanzado de análisis y gestión de activos
            </p>
          </div>
        </div>
        <Badge className={riskProfileColors[portfolio.risk_profile]}>
          {riskProfileLabels[portfolio.risk_profile]}
        </Badge>
      </div>

      {/* Main Asset Management Card - Full Width */}
      <Card className='border-cactus-200'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl text-sage-900'>
                Activos Actuales
              </CardTitle>
              <CardDescription>
                Gestione los activos de la cartera •{' '}
                {portfolio.positions?.length || 0} activos configurados
                <span
                  className={`ml-3 font-medium ${isComplete ? 'text-cactus-600' : 'text-amber-600'}`}
                >
                  Asignación: {totalWeight.toFixed(1)}%
                </span>
              </CardDescription>
            </div>
            <AddAssetDialog
              portfolioId={portfolioId}
              onAssetAdded={fetchPortfolio}
            >
              <Button className='bg-cactus-500 text-white hover:bg-cactus-600'>
                <Plus className='mr-2 h-4 w-4' />
                Añadir Activo
              </Button>
            </AddAssetDialog>
          </div>
          {!isComplete && (
            <div
              className={`mt-2 text-sm ${totalWeight < 100 ? 'text-amber-600' : 'text-red-600'}`}
            >
              {totalWeight < 100
                ? `⚠️ Falta ${(100 - totalWeight).toFixed(1)}% por asignar`
                : `⚠️ Excede por ${(totalWeight - 100).toFixed(1)}%`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {portfolio.positions && portfolio.positions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='text-sage-700'>Activo</TableHead>
                  <TableHead className='text-sage-700'>Sector</TableHead>
                  <TableHead className='text-sage-700'>Tipo</TableHead>
                  <TableHead className='text-sage-700'>Ponderación</TableHead>
                  <TableHead className='text-right text-sage-700'>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.positions.map((position) => (
                  <TableRow key={position.id} className='hover:bg-cactus-50'>
                    <TableCell>
                      <div>
                        <p className='font-semibold text-sage-900'>
                          {position.asset.ticker_symbol}
                        </p>
                        <p className='text-sm text-sage-600'>
                          {position.asset.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className='border-sage-200 text-sage-700'
                      >
                        {position.asset.sector || 'Sin Clasificar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className='bg-sand-100 text-sand-800'
                      >
                        {position.asset.asset_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingRowId === position.id ? (
                        <div className='flex space-x-2'>
                          <Input
                            type='number'
                            min='0.1'
                            max='100'
                            step='0.1'
                            value={currentEditValue}
                            onChange={(e) =>
                              setCurrentEditValue(e.target.value)
                            }
                            className='w-20'
                            autoFocus
                          />
                          <span className='self-center text-sm text-sage-600'>
                            %
                          </span>
                        </div>
                      ) : (
                        <span className='font-semibold text-sage-900'>
                          {(Number(position.weight) * 100).toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end space-x-1'>
                        {editingRowId === position.id ? (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleConfirmEdit(position)}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0 hover:bg-green-100'
                            >
                              <Check className='h-4 w-4 text-green-600' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setEditingRowId(null)}
                              disabled={isUpdating}
                              className='h-8 w-8 p-0 hover:bg-red-100'
                            >
                              <X className='h-4 w-4 text-red-600' />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleEditPosition(position)}
                              className='h-8 w-8 p-0 hover:bg-cactus-100'
                            >
                              <Edit2 className='h-4 w-4 text-sage-600' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleDeletePosition(position)}
                              className='h-8 w-8 p-0 hover:bg-red-100'
                            >
                              <Trash2 className='h-4 w-4 text-red-600' />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='py-12 text-center text-sage-500'>
              <PieChart className='mx-auto mb-4 h-16 w-16 text-sage-300' />
              <h3 className='mb-2 text-lg font-medium'>
                No hay activos en la cartera
              </h3>
              <p className='mb-4 text-sm'>
                Comience añadiendo activos para crear su estrategia de inversión
              </p>
              <AddAssetDialog
                portfolioId={portfolioId}
                onAssetAdded={fetchPortfolio}
              >
                <Button className='bg-cactus-500 text-white hover:bg-cactus-600'>
                  <Plus className='mr-2 h-4 w-4' />
                  Añadir Primer Activo
                </Button>
              </AddAssetDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid - Two Columns */}
      {portfolio.positions && portfolio.positions.length > 0 && (
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Sector Allocation Chart */}
          <Card className='border-sage-200'>
            <CardHeader>
              <CardTitle className='text-lg text-sage-900'>
                Composición por Sector
              </CardTitle>
              <CardDescription>
                Distribución porcentual por sector económico
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <ResponsiveContainer width='100%' height={350}>
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => [
                        `${(Number(value) || 0).toFixed(1)}%`,
                        `${name} (${props.payload.assets?.join(', ') || ''})`,
                      ]}
                      contentStyle={{
                        backgroundColor: '#f0f9f0',
                        border: '1px solid #5cb35c',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Pie
                      data={sectorData}
                      cx='50%'
                      cy='50%'
                      outerRadius={120}
                      dataKey='value'
                      label={({ name, value }: any) =>
                        `${name}: ${(Number(value) || 0).toFixed(1)}%`
                      }
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`sector-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className='py-12 text-center text-sage-500'>
                  <PieChart className='mx-auto mb-4 h-12 w-12' />
                  <p>No hay sectores para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Allocation Chart */}
          <Card className='border-sage-200'>
            <CardHeader>
              <CardTitle className='text-lg text-sage-900'>
                Composición por Activo
              </CardTitle>
              <CardDescription>
                Distribución porcentual de cada activo en la cartera
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetData.length > 0 ? (
                <ResponsiveContainer width='100%' height={350}>
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => [
                        `${(Number(value) || 0).toFixed(1)}%`,
                        `${props.payload.ticker} - ${name}`,
                      ]}
                      contentStyle={{
                        backgroundColor: '#f0f9f0',
                        border: '1px solid #5cb35c',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    <Pie
                      data={assetData}
                      cx='50%'
                      cy='50%'
                      outerRadius={120}
                      dataKey='value'
                      label={({ ticker, value }: any) =>
                        `${ticker}: ${(Number(value) || 0).toFixed(1)}%`
                      }
                    >
                      {assetData.map((entry, index) => (
                        <Cell key={`asset-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className='py-12 text-center text-sage-500'>
                  <PieChart className='mx-auto mb-4 h-12 w-12' />
                  <p>No hay activos en la cartera</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical Performance Analysis - Full Width */}
      <HistoricalPerformanceChart
        portfolioId={portfolioId}
        composition={portfolio.positions || []}
        isComplete={isComplete}
      />
    </div>
  );
}
