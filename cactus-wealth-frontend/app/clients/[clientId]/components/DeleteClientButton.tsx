'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Client } from '@/types';
import { DeleteClientDialog } from './DeleteClientDialog';

interface DeleteClientButtonProps {
  client: Client;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function DeleteClientButton({
  client,
  variant = 'destructive',
  size = 'sm',
  className = '',
}: DeleteClientButtonProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDeleteDialogOpen(true)}
        className={className}
      >
        <Trash2 className='mr-2 h-4 w-4' />
        Eliminar Cliente
      </Button>

      <DeleteClientDialog
        client={client}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}
