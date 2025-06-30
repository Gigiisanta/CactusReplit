'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Client } from '@/types';
import { DataTable } from './components/data-table';
import { DataTableSkeleton } from './components/data-table.skeleton';
import { createColumns } from './components/columns';
import { AddClientDialog } from '@/components/clients/add-client-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const clientsData = await apiClient.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Callback function to refresh client list when a new client is added
  const handleClientAdded = () => {
    fetchClients();
  };

  useEffect(() => {
    fetchClients();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  CRM - Gestión de Clientes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona tu cartera de clientes y visualiza su información completa.
                </p>
              </div>
            </div>
            <AddClientDialog onClientAdded={handleClientAdded} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Cargando información de clientes...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableSkeleton rows={10} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Error al cargar clientes</h3>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                CRM - Gestión de Clientes
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona tu cartera de clientes y visualiza su información completa.
              </p>
            </div>
          </div>
          <AddClientDialog onClientAdded={handleClientAdded} />
        </div>
      </div>

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-16 pb-16">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="rounded-full bg-muted p-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Aún no tienes clientes</h3>
                <p className="text-muted-foreground max-w-md">
                  Comienza a construir tu cartera añadiendo tu primer cliente. 
                  Podrás gestionar sus inversiones, seguros y generar reportes detallados.
                </p>
              </div>
              
              <div className="space-y-3">
                <AddClientDialog 
                  onClientAdded={handleClientAdded} 
                  trigger={
                    <Button size="lg" className="gap-2">
                      <Users className="h-5 w-5" />
                      Añadir tu primer cliente
                    </Button>
                  }
                />
                <p className="text-xs text-muted-foreground">
                  ✨ Comienza a hacer crecer tu negocio hoy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={createColumns(fetchClients)} data={clients} />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 