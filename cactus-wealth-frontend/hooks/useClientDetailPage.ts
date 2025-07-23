import { useState, useCallback, useEffect, useRef } from 'react';
import { useClient } from '@/context/ClientContext';
import { apiClient } from '@/lib/api';
import { Client } from '@/types';

export function useClientDetailPage(clientId: string) {
  const { setActiveClient } = useClient();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialized = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTime = useRef<number>(0);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    // Prevent multiple simultaneous requests
    const now = Date.now();
    if (now - lastRefreshTime.current < 1000) {
      return;
    }
    lastRefreshTime.current = now;

    try {
      setIsLoading(true);
      setError(null);
      const clientData = await apiClient.getClient(parseInt(clientId));
      setClient(clientData);
      setActiveClient(clientData);
    } catch (error) {
      console.error('Error fetching client:', error);
      setError('Cliente no encontrado');
      setActiveClient(null);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]); // Remove setActiveClient from dependencies

  // Only fetch on mount and when clientId changes
  useEffect(() => {
    if (!isInitialized.current || clientId) {
      fetchClient();
      isInitialized.current = true;
    }

    return () => {
      setActiveClient(null);
    };
  }, [clientId]); // Only depend on clientId

  const refreshClient = useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Debounce refresh calls
    refreshTimeoutRef.current = setTimeout(() => {
      fetchClient();
    }, 100);
  }, [fetchClient]);

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    const event = new CustomEvent('client:cancel');
    window.dispatchEvent(event);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    client,
    isLoading,
    error,
    isEditing,
    isSaving,
    refreshClient,
    handleEditStart,
    handleEditCancel,
    setActiveClient: setClient,
    setIsEditing,
    setIsSaving,
    setClient,
  };
}
