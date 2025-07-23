'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Client } from '@/types';

interface ClientContextType {
  activeClient: Client | null;
  setActiveClient: (client: Client | null) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<Client | null>(null);

  const setActiveClient = useCallback((client: Client | null) => {
    setActiveClientState(client);
  }, []);

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
