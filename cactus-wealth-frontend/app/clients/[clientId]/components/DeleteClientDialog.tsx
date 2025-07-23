'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client } from '@/types';
import { ClientService } from '@/services/client.service';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface DeleteClientDialogProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteClientDialog({
  client,
  isOpen,
  onClose,
}: DeleteClientDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const expectedText = `${client.first_name} ${client.last_name}`;
  const isConfirmed = confirmationText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsLoading(true);

    try {
      await ClientService.deleteClient(client.id);

      toast.success('Cliente eliminado correctamente');

      router.push('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('No se pudo eliminar el cliente. Intenta nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='h-5 w-5' />
            Eliminar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>¡Atención!</strong> Esta acción no se puede deshacer. Se
              eliminará permanentemente:
              <ul className='ml-4 mt-2 list-disc text-sm'>
                <li>Toda la información del cliente</li>
                <li>Cuentas de inversión asociadas</li>
                <li>Pólizas de seguro</li>
                <li>Notas y actividades</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className='rounded-lg bg-gray-50 p-4'>
            <h4 className='mb-2 font-medium text-gray-900'>
              Cliente a eliminar:
            </h4>
            <p className='text-sm text-gray-700'>
              <span className='font-medium'>
                {client.first_name} {client.last_name}
              </span>
              <br />
              {client.email}
            </p>
          </div>

          <div>
            <Label htmlFor='confirmation'>
              Para confirmar, escribe el nombre completo del cliente:
            </Label>
            <Input
              id='confirmation'
              type='text'
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={expectedText}
              className='mt-2'
              autoComplete='off'
            />
            <p className='mt-1 text-sm text-gray-600'>
              Esperado: <span className='font-medium'>{expectedText}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
