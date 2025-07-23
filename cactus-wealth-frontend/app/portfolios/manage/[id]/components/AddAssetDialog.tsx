'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export default function AddAssetDialog({
  portfolioId,
  onAssetAdded,
  children,
}: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [weightInput, setWeightInput] = useState('');

  // Remove debounceSearch useCallback and move logic inline in useEffect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const debounced = (query: string) => {
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
    debounced(searchQuery);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
        weight: weight,
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Añadir Activo a la Cartera</DialogTitle>
        </DialogHeader>

        <form
          role='form'
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPosition();
          }}
          className='space-y-6'
        >
          {/* Search Input */}
          <div>
            <Label htmlFor='search'>Buscar Activo</Label>
            <div className='relative mt-2'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                id='search'
                placeholder='Ej: AAPL, Apple, SPY, Microsoft...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <div className='max-h-64 overflow-y-auto rounded-md border'>
              {isSearching ? (
                <div className='p-4 text-center text-gray-500'>
                  <Search className='mx-auto mb-2 h-4 w-4 animate-spin' />
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((asset) => (
                  <div
                    key={asset.id}
                    className={`cursor-pointer border-b p-3 last:border-b-0 hover:bg-gray-50 ${
                      selectedAsset?.id === asset.id
                        ? 'border-cactus-200 bg-cactus-50'
                        : ''
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>{asset.ticker_symbol}</p>
                        <p className='text-sm text-gray-600'>{asset.name}</p>
                        {asset.sector && (
                          <p className='text-xs text-gray-500'>
                            {asset.sector}
                          </p>
                        )}
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {asset.asset_type}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className='p-4 text-center text-gray-500'>
                  No se encontraron activos
                </div>
              )}
            </div>
          )}

          {/* Selected Asset and Weight Input */}
          {selectedAsset && (
            <div className='space-y-4 rounded-md border border-cactus-200 bg-cactus-50 p-4'>
              <div>
                <p className='font-medium text-cactus-900'>
                  Activo Seleccionado:
                </p>
                <p className='text-sm text-cactus-700'>
                  {selectedAsset.ticker_symbol} - {selectedAsset.name}
                </p>
                {selectedAsset.sector && (
                  <Badge variant='outline' className='mt-1 text-xs'>
                    {selectedAsset.sector}
                  </Badge>
                )}
              </div>

              <div className='flex space-x-3'>
                <div className='flex-1'>
                  <Label htmlFor='weight'>Ponderación (%)</Label>
                  <Input
                    id='weight'
                    type='number'
                    min='0.1'
                    max='100'
                    step='0.1'
                    placeholder='Ej: 15.5'
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className='mt-1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    type='submit'
                    className='bg-cactus-500 text-white hover:bg-cactus-600'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
