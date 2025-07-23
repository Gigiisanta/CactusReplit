'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { LiveNotifications } from '@/components/realtime/LiveNotifications';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useRef } from 'react';

export function Header() {
  const { logout, user, token } = useAuth();
  const { connect, disconnect, isConnected } = useWebSocket();
  const hasConnected = useRef(false);

  useEffect(() => {
    if (token && !isConnected && !hasConnected.current) {
      hasConnected.current = true;
      connect(token).catch((error) => {
        console.error('WebSocket connection error:', error);
        hasConnected.current = false;
      });
    }

    if (!token && isConnected) {
      disconnect();
      hasConnected.current = false;
    }
  }, [token, isConnected, connect, disconnect]);

  const handleLogout = async () => {
    try {
      disconnect();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className='brand-shadow border-b border-gray-200 bg-white'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <span className='mr-2 text-2xl'>🌵</span>
            <h1 className='text-xl font-bold text-cactus-700'>Cactus Wealth</h1>
          </div>
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-600'>
              Welcome, {user?.email}
            </span>
            <LiveNotifications />
            <Button
              onClick={handleLogout}
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <LogOut className='h-4 w-4' />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
