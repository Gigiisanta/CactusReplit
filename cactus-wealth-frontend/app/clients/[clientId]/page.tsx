'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Client } from '@/types';
import { ClientHeader } from './components/ClientHeader';
import { ClientDetailsCard } from './components/ClientDetailsCard';
import { InvestmentAccountsSection } from './components/InvestmentAccountsSection';
import { InsurancePoliciesSection } from './components/InsurancePoliciesSection';
import { ClientDetailPageSkeleton } from './components/ClientDetailsSkeleton';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const clientData = await apiClient.getClient(parseInt(clientId));
      setClient(clientData);
    } catch (error) {
      console.error('Error fetching client:', error);
      setError('Cliente no encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClient = () => {
    fetchClient();
  };

  if (isLoading) {
    return <ClientDetailPageSkeleton />;
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h1>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del cliente.</p>
          <button 
            onClick={fetchClient}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ClientHeader client={client} />
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <ClientDetailsCard client={client} />
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <InvestmentAccountsSection 
            clientId={client.id}
            accounts={client.investment_accounts || []} 
            onDataChange={refreshClient}
          />
          
          <InsurancePoliciesSection 
            clientId={client.id}
            policies={client.insurance_policies || []} 
            onDataChange={refreshClient}
          />
        </div>
      </div>
    </div>
  );
} 