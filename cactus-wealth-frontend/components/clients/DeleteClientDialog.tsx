'use client';

import { useState } from 'react';
import { Client } from '@/types';
import { ClientService } from '@/services/client.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteClientDialogProps {
  client: Client;
  onClientDeleted: () => void;
  trigger?: React.ReactNode;
}

export function DeleteClientDialog({
  client,
  onClientDeleted,
  trigger,
}: DeleteClientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await ClientService.deleteClient(client.id);
      toast.success(
        `Cliente ${client.first_name} ${client.last_name} eliminado`
      );
      onClientDeleted();
      setOpen(false);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant='ghost' size='sm'>
            <Trash2 className='h-4 w-4' />
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
            <strong>
              {client.first_name} {client.last_name}
            </strong>{' '}
            y todos sus datos asociados (portafolios, cuentas de inversión y
            pólizas de seguro).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
