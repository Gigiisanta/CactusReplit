'use client';
import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthProvider } from '@/context/AuthContext';
import { TokenExpiryWarning } from '@/components/layout/TokenExpiryWarning';
import { Toaster } from '@/components/ui/sonner';

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TokenExpiryWarning />
        {children}
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
