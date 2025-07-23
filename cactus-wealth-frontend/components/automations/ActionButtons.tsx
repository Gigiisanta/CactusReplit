'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail } from 'lucide-react';
import { apiClientInterceptor } from '@/lib/apiClient';
import { toast } from 'sonner';

interface ActionButtonsProps {
  onStatusChange?: () => void;
}

export function ActionButtons({ onStatusChange }: ActionButtonsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleTriggerSync = async () => {
    try {
      setIsSyncing(true);

      const syncResponse = await apiClientInterceptor
        .getClient()
        .post('/automations/trigger-sync');
      const syncResult = syncResponse.data;

      toast.promise(Promise.resolve(syncResult), {
        loading: 'Triggering full sync...',
        success: () => {
          onStatusChange?.();
          return '✅ Full sync triggered successfully!';
        },
        error: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : 'Sync failed';
          return `❌ Error: ${errorMessage}`;
        },
      });

      await Promise.resolve(syncResult);
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setIsSendingEmail(true);

      const emailResponse = await apiClientInterceptor
        .getClient()
        .post('/automations/send-test-email');
      const emailResult = emailResponse.data;

      toast.promise(Promise.resolve(emailResult), {
        loading: 'Sending test email...',
        success: () => {
          return '✅ Test email sent successfully!';
        },
        error: (err) => {
          const errorMessage =
            err instanceof Error ? err.message : 'Email failed';
          return `❌ Error: ${errorMessage}`;
        },
      });

      await Promise.resolve(emailResult);
    } catch (error) {
      console.error('Error sending test email:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className='flex flex-col gap-4 sm:flex-row'>
      <Button
        onClick={handleTriggerSync}
        disabled={isSyncing}
        className='flex items-center gap-2'
        variant='outline'
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Trigger Full Sync'}
      </Button>

      <Button
        onClick={handleSendTestEmail}
        disabled={isSendingEmail}
        className='flex items-center gap-2'
        variant='outline'
      >
        <Mail className='h-4 w-4' />
        {isSendingEmail ? 'Sending...' : 'Send Test Email'}
      </Button>
    </div>
  );
}
