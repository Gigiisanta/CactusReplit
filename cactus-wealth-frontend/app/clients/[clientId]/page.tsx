'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Client } from '@/types';
import { useClient } from '@/context/ClientContext';
import { ClientHeader } from './components/ClientHeader';
import { ClientDetailsCard } from './components/ClientDetailsCard';
import { LiveNotesSection } from './components/LiveNotesSection';
import { ClientDetailPageSkeleton } from './components/ClientDetailsSkeleton';
import { DeleteClientButton } from './components/DeleteClientButton';
import { useClientDetailPage } from '@/hooks/useClientDetailPage';
import { ClientNotesSection } from './components/ClientNotesSection';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const {
    client,
    isLoading,
    error,
    isEditing,
    isSaving,
    refreshClient,
    handleEditStart,
    handleEditCancel,
    setActiveClient,
    setIsEditing,
    setIsSaving,
    setClient,
  } = useClientDetailPage(clientId);

  const eventListenersAdded = useRef(false);

  // Listen for save events from ClientDetailsCard
  const handleSaveStart = useCallback(() => {
    setIsSaving(true);
  }, [setIsSaving]);

  const handleSaveComplete = useCallback(() => {
    setIsEditing(false);
    setIsSaving(false);
  }, [setIsEditing, setIsSaving]);

  // Listen for global client update events
  const handleClientUpdated = useCallback(
    (event: any) => {
      const { clientId: updatedClientId, updatedClient } = event.detail || {};
      if (updatedClientId && updatedClientId.toString() === clientId) {
        // Force refresh data from server
        refreshClient();
      }
    },
    [clientId, refreshClient]
  );

  useEffect(() => {
    // Only add event listeners once
    if (!eventListenersAdded.current) {
      window.addEventListener('client:saving', handleSaveStart);
      window.addEventListener('client:saved', handleSaveComplete);
      window.addEventListener('client:updated', handleClientUpdated);
      eventListenersAdded.current = true;
    }

    // Cleanup function
    return () => {
      if (eventListenersAdded.current) {
        setActiveClient(null);
        window.removeEventListener('client:saving', handleSaveStart);
        window.removeEventListener('client:saved', handleSaveComplete);
        window.removeEventListener('client:updated', handleClientUpdated);
        eventListenersAdded.current = false;
      }
    };
  }, [
    clientId,
    setActiveClient,
    handleSaveStart,
    handleSaveComplete,
    handleClientUpdated,
  ]);

  if (isLoading) {
    return <ClientDetailPageSkeleton />;
  }

  if (error || !client) {
    return (
      <div className='container mx-auto py-6'>
        <div className='py-8 text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>
            Cliente no encontrado
          </h1>
          <p className='mb-4 text-gray-600'>
            No se pudo cargar la información del cliente.
          </p>
          <button
            onClick={refreshClient}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <ClientHeader
        client={client}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        isEditing={isEditing}
        isSaving={isSaving}
      />

      <div className='grid gap-6 lg:grid-cols-5'>
        {/* En pantallas pequeñas, las notas aparecen primero */}
        <div className='space-y-6 lg:order-2 lg:col-span-2'>
          <LiveNotesSection client={client} onClientUpdate={setClient} />
          <ClientNotesSection
            clientId={client.id}
            onDataChange={refreshClient}
          />
        </div>

        <div className='space-y-6 lg:order-1 lg:col-span-3'>
          <ClientDetailsCard
            client={client}
            onClientUpdate={setClient}
            onDataChange={refreshClient}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />

          {/* Botón de eliminar cliente */}
          {!isEditing && (
            <div className='flex justify-end'>
              <DeleteClientButton
                client={client}
                variant='outline'
                size='sm'
                className='w-full border-red-200 text-red-700 hover:bg-red-50'
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
