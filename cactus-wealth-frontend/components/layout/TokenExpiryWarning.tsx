'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTokenTimeRemaining } from '@/lib/token-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export function TokenExpiryWarning() {
  const { token, logout } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!token) {
      setShowWarning(false);
      setDismissed(false);
      return;
    }

    const checkTokenExpiry = () => {
      const remaining = getTokenTimeRemaining(token);
      setTimeRemaining(remaining);

      // Show warning if token expires in 10 minutes or less
      if (remaining <= 10 && remaining > 0 && !dismissed) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [token, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowWarning(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!showWarning || !timeRemaining) {
    return null;
  }

  return (
    <div className='fixed left-1/2 top-16 z-50 w-full max-w-md -translate-x-1/2 transform'>
      <Alert className='border-yellow-500 bg-yellow-50 text-yellow-800'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription className='flex items-center justify-between'>
          <div className='flex-1'>
            <p className='font-medium'>Sesión expirando pronto</p>
            <p className='text-sm'>
              Tu sesión expirará en {timeRemaining} minuto
              {timeRemaining !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className='ml-4 flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleLogout}
              className='border-yellow-300 text-yellow-800 hover:bg-yellow-100'
            >
              Volver a entrar
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={handleDismiss}
              className='h-6 w-6 p-1 text-yellow-800 hover:bg-yellow-100'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
