'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Client, ClientStatus } from '@/types';
import { DataTable } from './components/data-table';
import { DataTableSkeleton } from './components/data-table.skeleton';
import { createColumns } from './components/columns';
import { AddClientDialog } from '@/components/clients/add-client-dialog';
import { PipelineBoard } from '@/components/clients/PipelineBoard';
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
  Users,
  AlertCircle,
  Table,
  Kanban,
  Plus,
  TrendingUp,
  Target,
  UserCheck,
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');
  const [isSyncing, setIsSyncing] = useState(false);
  const lastUpdatedClientId = useRef<number | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Force cache invalidation by adding timestamp to request
      const timestamp = Date.now();
      const clientsData = await apiClient.getClients();

      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic update handler
  const handleClientStatusChange = (clientId: number, newStatus: ClientStatus) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c))
    );
    lastUpdatedClientId.current = clientId;
    setIsSyncing(true);
    // Sync in background
    apiClient.getClients().then((clientsData) => {
      setClients(clientsData);
      setIsSyncing(false);
    }).catch(() => setIsSyncing(false));
  };

  const handleClientAdded = () => {
    // Refresh clients list after adding a new client
    fetchClients();
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Memoize client metrics calculations to avoid unnecessary recalculations
  const clientMetrics = useMemo(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    const totalClients = safeClients.length;
    const activeClients = safeClients.filter(
      (c) =>
        c.status === ClientStatus.ACTIVE_INVESTOR ||
        c.status === ClientStatus.ACTIVE_INSURED
    ).length;
    const prospects = safeClients.filter(
      (c) => c.status === ClientStatus.PROSPECT
    ).length;
    const totalAUM = safeClients.reduce((sum, client) => {
      return (
        sum +
        (client.investment_accounts?.reduce((acc, inv) => acc + inv.aum, 0) ||
          0)
      );
    }, 0);

    return {
      totalClients,
      activeClients,
      prospects,
      totalAUM,
    };
  }, [clients]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className='flex-1 space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <div className='h-8 w-64 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='h-10 w-32 animate-pulse rounded bg-slate-200' />
        </div>
        <DataTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex-1 space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold text-slate-900'>
              CRM - Gestión de Clientes
            </h1>
            <p className='text-slate-600'>
              Gestiona tu cartera de clientes y visualiza su información
              completa.
            </p>
          </div>
        </div>

        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              <p className='font-medium'>Error al cargar los clientes</p>
            </div>
            <p className='mt-2 text-sm text-red-600'>{error}</p>
            <Button
              onClick={fetchClients}
              className='mt-4 bg-red-600 hover:bg-red-700'
            >
              Intentar nuevamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-6 p-6'>
      {/* Header mejorado */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-slate-900'>
            CRM - Gestión de Clientes
          </h1>
          <p className='text-slate-600'>
            Gestiona tu cartera de clientes y visualiza su información completa.
          </p>
        </div>
        <AddClientDialog
          onClientAdded={handleClientAdded}
          trigger={
            <Button className='bg-green-600 font-medium text-white hover:bg-green-700'>
              <Plus className='mr-2 h-4 w-4' />
              Añadir Cliente
            </Button>
          }
        />
      </div>

      {/* Métricas destacadas */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-slate-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Total Clientes
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {clientMetrics.totalClients}
                </p>
              </div>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100'>
                <Users className='h-6 w-6 text-slate-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Clientes Activos
                </p>
                <p className='text-2xl font-bold text-green-700'>
                  {clientMetrics.activeClients}
                </p>
              </div>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
                <UserCheck className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-blue-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>Prospectos</p>
                <p className='text-2xl font-bold text-blue-700'>
                  {clientMetrics.prospects}
                </p>
              </div>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
                <Target className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>AUM Total</p>
                <p className='text-2xl font-bold text-green-700'>
                  {formatCurrency(clientMetrics.totalAUM)}
                </p>
              </div>
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback visual de sincronización */}
      {isSyncing && (
        <div className='mb-2 text-xs text-blue-600 animate-pulse'>Sincronizando cambios...</div>
      )}
      {/* Controles de vista */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-slate-700'>
            {clientMetrics.totalClients} cliente
            {clientMetrics.totalClients !== 1 ? 's' : ''} en total
          </span>
          <Badge variant='secondary' className='text-xs'>
            Vista de {viewMode === 'table' ? 'tabla' : 'pipeline'}
          </Badge>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-slate-900 text-white' : ''}
          >
            <Table className='mr-2 h-4 w-4' />
            Tabla
          </Button>
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('pipeline')}
            className={viewMode === 'pipeline' ? 'bg-slate-900 text-white' : ''}
          >
            <Kanban className='mr-2 h-4 w-4' />
            Pipeline
          </Button>
        </div>
      </div>

      {/* Vista de datos */}
      {viewMode === 'table' ? (
        <DataTable columns={createColumns(fetchClients)} data={clients} />
      ) : (
        <PipelineBoard
          clients={clients}
          onClientUpdated={(clientId, newStatus) => handleClientStatusChange(clientId, newStatus)}
        />
      )}
    </div>
  );
}
