'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { Asset } from '@/types';

interface AddAssetDialogProps {
  portfolioId: number;
  onAssetAdded: () => void;
  children: React.ReactNode;
}

export default function AddAssetDialog({ portfolioId, onAssetAdded, children }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [weightInput, setWeightInput] = useState('');

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
      
      // Reset form
      setSelectedAsset(null);
      setWeightInput('');
      setSearchQuery('');
      setSearchResults([]);
      setOpen(false);
      
      // Notify parent component
      onAssetAdded();
    } catch (error: any) {
      console.error('Error adding position:', error);
      toast.error(error.message || 'Error al añadir el activo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir Activo a la Cartera</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          
          {/* Search Input */}
          <div>
            <Label htmlFor="search">Buscar Activo</Label>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                placeholder="Ej: AAPL, Apple, SPY, Microsoft..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <div className="border rounded-md max-h-64 overflow-y-auto">
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
                      selectedAsset?.id === asset.id ? 'bg-cactus-50 border-cactus-200' : ''
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
                      <Badge variant="outline" className="text-xs">
                        {asset.asset_type}
                      </Badge>
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
            <div className="bg-cactus-50 border border-cactus-200 p-4 rounded-md space-y-4">
              <div>
                <p className="font-medium text-cactus-900">Activo Seleccionado:</p>
                <p className="text-sm text-cactus-700">
                  {selectedAsset.ticker_symbol} - {selectedAsset.name}
                </p>
                {selectedAsset.sector && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {selectedAsset.sector}
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-3">
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
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddPosition}
                    className="bg-cactus-500 hover:bg-cactus-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
} 