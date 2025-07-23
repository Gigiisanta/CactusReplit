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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { PortfolioService } from '@/services';

interface ModelPortfolio {
  id: number;
  name: string;
  description: string | null;
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
  positions: ModelPortfolioPosition[];
}

interface ModelPortfolioPosition {
  id: number;
  weight: number;
  asset: {
    id: number;
    ticker_symbol: string;
    name: string;
    asset_type: string;
  };
}

interface CreatePortfolioData {
  name: string;
  description: string;
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
}

const riskProfileLabels = {
  LOW: 'Conservador',
  MEDIUM: 'Moderado',
  HIGH: 'Agresivo',
};

const riskProfileColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<ModelPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePortfolioData>({
    name: '',
    description: '',
    risk_profile: 'LOW',
  });

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await PortfolioService.getModelPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      toast.error('Error al cargar las carteras modelo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Import auth store dynamically to access current token
      const { useAuthStore } = await import('@/stores/auth.store');

      const newPortfolio =
        await PortfolioService.createModelPortfolio(formData);
      setPortfolios([...portfolios, newPortfolio]);
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', risk_profile: 'LOW' });
      toast.success('Cartera modelo creada exitosamente');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error('Error al crear la cartera modelo');
    }
  };

  const handleDeletePortfolio = async (portfolioId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta cartera modelo?')) {
      return;
    }

    try {
      await PortfolioService.deleteModelPortfolio(portfolioId);
      setPortfolios(portfolios.filter((p) => p.id !== portfolioId));
      toast.success('Cartera modelo eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error('Error al eliminar la cartera modelo');
    }
  };

  const calculateTotalWeight = (positions: ModelPortfolioPosition[]) => {
    return positions.reduce(
      (total, position) => total + Number(position.weight),
      0
    );
  };

  if (loading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <PieChart className='mx-auto mb-4 h-12 w-12 animate-spin text-gray-400' />
            <p className='text-gray-500'>Cargando carteras modelo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Gestión de Carteras Modelo
          </h1>
          <p className='text-muted-foreground'>
            Cree y gestione plantillas de carteras basadas en ponderación
            porcentual de activos
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size='lg'>
              <Plus className='mr-2 h-4 w-4' />
              Nueva Cartera
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Cartera Modelo</DialogTitle>
              <DialogDescription>
                Defina los detalles básicos de la nueva cartera modelo. Podrá
                agregar activos después.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePortfolio} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Nombre de la Cartera</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='ej. Cartera Conservadora'
                  required
                />
              </div>
              <div>
                <Label htmlFor='description'>Descripción (opcional)</Label>
                <Input
                  id='description'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Descripción de la estrategia...'
                />
              </div>
              <div>
                <Label htmlFor='risk_profile'>Perfil de Riesgo</Label>
                <Select
                  value={formData.risk_profile}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') =>
                    setFormData({ ...formData, risk_profile: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='LOW'>Conservador</SelectItem>
                    <SelectItem value='MEDIUM'>Moderado</SelectItem>
                    <SelectItem value='HIGH'>Agresivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-end space-x-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type='submit'>Crear Cartera</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <Target className='mb-4 h-16 w-16 text-gray-400' />
            <h3 className='mb-2 text-lg font-semibold'>
              No hay carteras modelo
            </h3>
            <p className='mb-4 text-center text-gray-500'>
              Comience creando su primera cartera modelo para estandarizar las
              estrategias de inversión.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Crear Primera Cartera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {portfolios.map((portfolio) => {
            const totalWeight = calculateTotalWeight(portfolio.positions);
            const isComplete = Math.abs(totalWeight - 1.0) < 0.0001; // 100%

            return (
              <Card
                key={portfolio.id}
                className='transition-shadow hover:shadow-lg'
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-lg'>
                        {portfolio.name}
                      </CardTitle>
                      {portfolio.description && (
                        <CardDescription className='mt-1'>
                          {portfolio.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Badge
                        className={riskProfileColors[portfolio.risk_profile]}
                      >
                        {riskProfileLabels[portfolio.risk_profile]}
                      </Badge>
                      <Badge variant={isComplete ? 'default' : 'secondary'}>
                        {(totalWeight * 100).toFixed(1)}%
                      </Badge>
                    </div>

                    <div className='text-sm text-gray-600'>
                      <p>{portfolio.positions.length} activos configurados</p>
                      {!isComplete && (
                        <p className='mt-1 text-amber-600'>
                          {totalWeight < 1
                            ? `Falta ${((1 - totalWeight) * 100).toFixed(1)}% por asignar`
                            : `Excede por ${((totalWeight - 1) * 100).toFixed(1)}%`}
                        </p>
                      )}
                    </div>

                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={() =>
                        (window.location.href = `/portfolios/manage/${portfolio.id}`)
                      }
                    >
                      <PieChart className='mr-2 h-4 w-4' />
                      Gestionar Activos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
