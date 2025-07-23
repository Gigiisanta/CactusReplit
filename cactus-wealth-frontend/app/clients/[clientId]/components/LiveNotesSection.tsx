'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface LiveNotesSectionProps {
  client: Client;
  onClientUpdate: (client: Client) => void;
}

export function LiveNotesSection({
  client,
  onClientUpdate,
}: LiveNotesSectionProps) {
  const [notes, setNotes] = useState(client.live_notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedNotesRef = useRef<string>(client.live_notes || '');

  // Update local state when client changes, but only if it's a real change
  useEffect(() => {
    if (client.live_notes !== lastSavedNotesRef.current) {
      setNotes(client.live_notes || '');
      lastSavedNotesRef.current = client.live_notes || '';
    }
  }, [client.live_notes]);

  useEffect(() => {
    setHasUnsavedChanges(notes !== (client.live_notes || ''));
  }, [notes, client.live_notes]);

  const saveNotes = useCallback(
    async (showToast = true) => {
      if (notes === (client.live_notes || '') || isLoading) {
        return;
      }

      setIsLoading(true);
      try {
        const updatedClient = await apiClient.updateClient(client.id, {
          live_notes: notes,
        });

        // Only update if the notes actually changed
        if (updatedClient.live_notes !== client.live_notes) {
          onClientUpdate(updatedClient);
          lastSavedNotesRef.current = updatedClient.live_notes || '';
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        if (showToast) {
          toast.success('Notas guardadas automáticamente');
        }
      } catch (error) {
        console.error('Error saving notes:', error);
        if (showToast) {
          toast.error('Error al guardar las notas');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [notes, client.live_notes, client.id, onClientUpdate, isLoading]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);

      // Clear previous timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveNotes(false);
      }, 2000); // Save after 2 seconds of inactivity
    },
    [saveNotes]
  );

  const handleManualSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    saveNotes(true);
  }, [saveNotes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    },
    [handleManualSave]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className='h-full w-full'>
      <CardHeader>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Notas de Reunión
          </CardTitle>
          <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center'>
            {lastSaved && (
              <div className='flex items-center gap-1 text-sm text-gray-500'>
                <Clock className='h-4 w-4' />
                <span className='hidden sm:inline'>Guardado</span>{' '}
                {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <Button
              size='sm'
              onClick={handleManualSave}
              disabled={isLoading || !hasUnsavedChanges}
              className='flex items-center gap-1'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : hasUnsavedChanges ? (
                <Save className='h-4 w-4' />
              ) : (
                <CheckCircle2 className='h-4 w-4' />
              )}
              {isLoading
                ? 'Guardando...'
                : hasUnsavedChanges
                  ? 'Guardar'
                  : 'Guardado'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='h-full'>
        <div className='flex h-full flex-col space-y-4'>
          <div className='mb-4 text-sm text-gray-600'>
            Toma notas durante la reunión. Usa{' '}
            <kbd className='rounded bg-gray-100 px-2 py-1 text-xs'>Ctrl+S</kbd>{' '}
            para guardar rápidamente.{' '}
            <span className='font-medium text-green-600'>
              Guardado automático activado
            </span>
            .
          </div>

          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Escribe aquí las notas de la reunión con el cliente...

Algunos puntos útiles a cubrir:
• Objetivos financieros del cliente
• Situación financiera actual
• Tolerancia al riesgo
• Productos de interés
• Próximos pasos
• Seguimiento necesario
• Observaciones personales'
            className='flex-1 resize-none font-mono text-sm'
            style={{ minHeight: '400px' }}
          />

          <div className='flex items-center justify-between text-sm text-gray-500'>
            <span>{notes.length} / 10,000 caracteres</span>
            <div className='flex items-center gap-2'>
              {hasUnsavedChanges && (
                <span className='font-medium text-amber-600'>
                  • Cambios sin guardar
                </span>
              )}
              {isLoading && (
                <span className='flex items-center gap-1 font-medium text-blue-600'>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  Guardando...
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
