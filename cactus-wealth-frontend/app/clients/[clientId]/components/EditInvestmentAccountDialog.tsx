'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvestmentAccount } from '@/types';

interface EditInvestmentAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: InvestmentAccount;
  onSubmit: (data: {
    platform?: string;
    account_number?: string;
    aum?: number;
  }) => void;
}

export function EditInvestmentAccountDialog({
  open,
  onOpenChange,
  account,
  onSubmit,
}: EditInvestmentAccountDialogProps) {
  const [formData, setFormData] = useState({
    platform: '',
    account_number: '',
    aum: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with account data
  useEffect(() => {
    if (account) {
      setFormData({
        platform: account.platform,
        account_number: account.account_number || '',
        aum: account.aum,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.platform.trim()) {
      toast.error('La plataforma es requerida');
      return;
    }

    if (formData.aum < 0) {
      toast.error('El AUM no puede ser negativo');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        platform: formData.platform.trim(),
        account_number: formData.account_number.trim() || undefined,
        aum: formData.aum,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar la cuenta'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Editar Cuenta de Inversión</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-platform'>Plataforma *</Label>
            <Input
              id='edit-platform'
              placeholder='ej. Balanz, Decrypto, IOL'
              value={formData.platform}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, platform: e.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-account_number'>Número de Cuenta</Label>
            <Input
              id='edit-account_number'
              placeholder='Opcional'
              value={formData.account_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  account_number: e.target.value,
                }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-aum'>AUM (Assets Under Management) *</Label>
            <Input
              id='edit-aum'
              type='number'
              step='0.01'
              min='0'
              placeholder='0.00'
              value={formData.aum || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  aum: parseFloat(e.target.value) || 0,
                }))
              }
              required
              disabled={isSubmitting}
            />
            <p className='text-xs text-muted-foreground'>
              Monto en USD que el cliente tiene invertido en esta plataforma
            </p>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
