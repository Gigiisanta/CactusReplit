'use client';

import { ArrowLeft, Edit, Calendar, X, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientHeaderProps {
  client: Client;
  onEditStart: () => void;
  onEditCancel: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

export function ClientHeader({
  client,
  onEditStart,
  onEditCancel,
  isEditing,
  isSaving,
}: ClientHeaderProps) {
  const router = useRouter();

  const handleSaveClick = async () => {
    // We need to get the form data from ClientDetailsCard
    // For now, we'll trigger the save from ClientDetailsCard directly
    const event = new CustomEvent('client:save');
    window.dispatchEvent(event);
  };

  return (
    <div className='mb-6 flex items-center justify-between'>
      <div className='flex items-center space-x-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.back()}
          className='pl-0'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Volver
        </Button>

        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            {client.first_name} {client.last_name}
          </h1>
          <p className='text-gray-600'>{client.email}</p>
        </div>
      </div>

      <div className='flex items-center space-x-3'>
        <Badge
          variant='outline'
          className='border-purple-200 bg-purple-50 text-purple-700'
        >
          <Calendar className='mr-1 h-3 w-3' />
          Primera Reunión
        </Badge>

        {isEditing ? (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={onEditCancel}
              disabled={isSaving}
              className='border-red-300 text-red-700 hover:bg-red-50'
            >
              <X className='mr-2 h-4 w-4' />
              Cancelar
            </Button>
            <Button
              size='sm'
              onClick={handleSaveClick}
              disabled={isSaving}
              className='bg-cactus-600 hover:bg-cactus-700 disabled:opacity-60'
            >
              {isSaving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className='mr-2 h-4 w-4' />
                  Guardar
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            variant='outline'
            size='sm'
            onClick={onEditStart}
            className='border-gray-300 text-gray-700 hover:bg-gray-50'
          >
            <Edit className='mr-2 h-4 w-4' />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
