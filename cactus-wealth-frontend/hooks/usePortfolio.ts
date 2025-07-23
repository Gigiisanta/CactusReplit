import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ModelPortfolio, ModelPortfolioPosition } from '@/types';

export function usePortfolioData(
  portfolioId: number,
  router: ReturnType<typeof useRouter>
) {
  const [portfolio, setPortfolio] = useState<ModelPortfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
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
  }, [portfolioId, router]);

  return { portfolio, loading, fetchPortfolio, setPortfolio };
}

export function usePortfolioUpdate(
  portfolioId: number,
  fetchPortfolio: () => Promise<void>
) {
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [currentEditValue, setCurrentEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditPosition = (position: ModelPortfolioPosition) => {
    setEditingRowId(position.id);
    setCurrentEditValue((Number(position.weight) * 100).toFixed(1));
  };

  const handleConfirmEdit = async (position: ModelPortfolioPosition) => {
    const newWeight = parseFloat(currentEditValue);
    if (isNaN(newWeight) || newWeight <= 0 || newWeight > 100) {
      toast.error('La ponderación debe estar entre 0.1% y 100%');
      return;
    }
    setIsUpdating(true);
    try {
      await apiClient.updateModelPortfolioPosition(portfolioId, position.id, {
        weight: newWeight / 100,
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

  return {
    editingRowId,
    currentEditValue,
    isUpdating,
    handleEditPosition,
    handleConfirmEdit,
    setEditingRowId,
    setCurrentEditValue,
    setIsUpdating,
  };
}
