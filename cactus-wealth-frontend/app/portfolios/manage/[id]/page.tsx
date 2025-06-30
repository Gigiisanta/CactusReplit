'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Plus, Edit2, Trash2, PieChart } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { 
  ModelPortfolio, 
  Asset, 
  ModelPortfolioPosition,
  AssetAllocationData,
  SectorAllocationData,
  RiskProfile
} from '@/types';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const riskProfileLabels = {
  LOW: 'Conservador',
  MEDIUM: 'Moderado', 
  HIGH: 'Agresivo'
};

const riskProfileColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800'
};

// Predefined colors for charts
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
];

export default function AssetManagementPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);

  const [portfolio, setPortfolio] = useState<ModelPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [editingPosition, setEditingPosition] = useState<ModelPortfolioPosition | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      const data = await apiClient.getModelPortfolio(portfolioId);
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Error al cargar la cartera');
      router.push('/portfolios');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debounceSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim().length >= 1) {
            setIsSearching(true);
            try {
              const results = await apiClient.searchAssets(query, 10);
              setSearchResults(results);
            } catch (error) {
              console.error('Error searching assets:', error);
              toast.error('Error al buscar activos');
            } finally {
              setIsSearching(false);
            }
          } else {
            setSearchResults([]);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debounceSearch(searchQuery);
  }, [searchQuery, debounceSearch]);

  const handleAddPosition = async () => {
    if (!selectedAsset || !weightInput) {
      toast.error('Seleccione un activo y especifique la ponderación');
      return;
    }

    const weight = parseFloat(weightInput) / 100; // Convert percentage to decimal
    if (weight <= 0 || weight > 1) {
      toast.error('La ponderación debe estar entre 0.1% y 100%');
      return;
    }

    try {
      await apiClient.addModelPortfolioPosition(portfolioId, {
        asset_id: selectedAsset.id,
        weight: weight
      });
      
      toast.success('Activo añadido a la cartera');
      setSelectedAsset(null);
      setWeightInput('');
      setSearchQuery('');
      setSearchResults([]);
      fetchPortfolio();
    } catch (error: any) {
      console.error('Error adding position:', error);
      toast.error(error.message || 'Error al añadir el activo');
    }
  };

  const handleUpdatePosition = async (position: ModelPortfolioPosition, newWeight: number) => {
    const weight = newWeight / 100; // Convert percentage to decimal
    if (weight <= 0 || weight > 1) {
      toast.error('La ponderación debe estar entre 0.1% y 100%');
      return;
    }

    try {
      await apiClient.updateModelPortfolioPosition(portfolioId, position.id, {
        weight: weight
      });
      
      toast.success('Ponderación actualizada');
      setEditingPosition(null);
      fetchPortfolio();
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error(error.message || 'Error al actualizar la ponderación');
    }
  };

  const handleDeletePosition = async (position: ModelPortfolioPosition) => {
    if (!confirm(`¿Está seguro de eliminar ${position.asset.ticker_symbol} de la cartera?`)) {
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

  // Calculate data for charts
  const getAssetAllocationData = (): AssetAllocationData[] => {
    if (!portfolio || !portfolio.positions) return [];
    
    return portfolio.positions.map((position, index) => ({
      name: position.asset.name,
      value: Number(position.weight) * 100,
      ticker: position.asset.ticker_symbol,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const getSectorAllocationData = (): SectorAllocationData[] => {
    if (!portfolio || !portfolio.positions) return [];
    
    const sectorMap = new Map<string, { value: number; assets: string[]; }>();
    
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
          assets: [position.asset.ticker_symbol]
        });
      }
    });

    return Array.from(sectorMap.entries()).map(([sector, data], index) => ({
      name: sector,
      value: data.value,
      assets: data.assets,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const calculateTotalWeight = () => {
    if (!portfolio || !portfolio.positions) return 0;
    return portfolio.positions.reduce((total, position) => total + Number(position.weight), 0) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <PieChart className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Cargando estudio de gestión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Cartera no encontrada</h1>
          <Button onClick={() => router.push('/portfolios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/portfolios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estudio de Gestión de Activos</h1>
            <p className="text-muted-foreground">
              Gestión avanzada de la cartera "{portfolio.name}"
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Portfolio Information and Charts */}
        <div className="space-y-6">
          
          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {portfolio.name}
                <Badge className={riskProfileColors[portfolio.risk_profile]}>
                  {riskProfileLabels[portfolio.risk_profile]}
                </Badge>
              </CardTitle>
              {portfolio.description && (
                <CardDescription>{portfolio.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {portfolio.positions?.length || 0} activos configurados
                </span>
                <Badge variant={isComplete ? "default" : "secondary"}>
                  {totalWeight.toFixed(1)}%
                </Badge>
              </div>
              {!isComplete && (
                <p className="text-sm text-amber-600 mt-2">
                  {totalWeight < 100 
                    ? `Falta ${(100 - totalWeight).toFixed(1)}% por asignar`
                    : `Excede por ${(totalWeight - 100).toFixed(1)}%`
                  }
                </p>
              )}
            </CardContent>
          </Card>

          {/* Asset Allocation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Composición por Activo</CardTitle>
              <CardDescription>Distribución porcentual de cada activo en la cartera</CardDescription>
            </CardHeader>
            <CardContent>
              {assetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}%`,
                        `${props.payload.ticker} - ${name}`
                      ]}
                    />
                    <Legend />
                    <Pie
                      data={assetData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ ticker, value }) => `${ticker}: ${value.toFixed(1)}%`}
                    >
                      {assetData.map((entry, index) => (
                        <Cell key={`asset-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <PieChart className="h-12 w-12 mx-auto mb-4" />
                  <p>No hay activos en la cartera</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sector Allocation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Composición por Sector</CardTitle>
              <CardDescription>Distribución porcentual por sector económico</CardDescription>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}%`,
                        `${name} (${props.payload.assets.join(', ')})`
                      ]}
                    />
                    <Legend />
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`sector-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <PieChart className="h-12 w-12 mx-auto mb-4" />
                  <p>No hay sectores para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Asset Management */}
        <div className="space-y-6">
          
          {/* Asset Search and Add */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Activo</CardTitle>
              <CardDescription>Busque activos y añádalos a la cartera con su ponderación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Search Input */}
              <div>
                <Label htmlFor="search">Buscar Activo</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Ej: AAPL, Apple, Microsoft..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Buscando...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((asset) => (
                      <div
                        key={asset.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                          selectedAsset?.id === asset.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{asset.ticker_symbol}</p>
                            <p className="text-sm text-gray-600">{asset.name}</p>
                            {asset.sector && (
                              <p className="text-xs text-gray-500">{asset.sector}</p>
                            )}
                          </div>
                          <Badge variant="outline">{asset.asset_type}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron activos
                    </div>
                  )}
                </div>
              )}

              {/* Selected Asset and Weight Input */}
              {selectedAsset && (
                <div className="bg-blue-50 p-4 rounded-md space-y-3">
                  <div>
                    <p className="font-medium text-blue-900">Activo Seleccionado:</p>
                    <p className="text-sm text-blue-700">
                      {selectedAsset.ticker_symbol} - {selectedAsset.name}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="weight">Ponderación (%)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        placeholder="Ej: 15.5"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddPosition}>
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Current Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activos Actuales</CardTitle>
              <CardDescription>Gestione los activos existentes en la cartera</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolio.positions && portfolio.positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activo</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Ponderación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{position.asset.ticker_symbol}</p>
                            <p className="text-sm text-gray-600">{position.asset.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {position.asset.sector || 'Sin Clasificar'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingPosition?.id === position.id ? (
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                min="0.1"
                                max="100"
                                step="0.1"
                                defaultValue={(Number(position.weight) * 100).toFixed(1)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    handleUpdatePosition(position, parseFloat(input.value));
                                  } else if (e.key === 'Escape') {
                                    setEditingPosition(null);
                                  }
                                }}
                                className="w-20"
                                autoFocus
                              />
                              <span className="text-sm self-center">%</span>
                            </div>
                          ) : (
                            <span className="font-medium">
                              {(Number(position.weight) * 100).toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPosition(position)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePosition(position)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <PieChart className="h-12 w-12 mx-auto mb-4" />
                  <p>No hay activos en la cartera</p>
                  <p className="text-sm">Utilice el buscador para añadir activos</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
} 