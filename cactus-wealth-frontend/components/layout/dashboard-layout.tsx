'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ClientProvider } from '@/context/ClientContext';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-cactus-500'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ClientProvider>
      <div className='min-h-screen bg-gray-50'>
        <Header />
        <div className='flex'>
          <Sidebar />
          <main className='flex-1 p-6'>{children}</main>
        </div>
      </div>
    </ClientProvider>
  );
}
