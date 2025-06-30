'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddInvestmentAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    platform: string;
    account_number?: string;
    aum: number;
  }) => void;
}

export function AddInvestmentAccountDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: AddInvestmentAccountDialogProps) {
  const [formData, setFormData] = useState({
    platform: '',
    account_number: '',
    aum: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      const submitPromise = Promise.resolve(onSubmit({
        platform: formData.platform.trim(),
        account_number: formData.account_number.trim() || undefined,
        aum: formData.aum,
      }));

      toast.promise(submitPromise, {
        loading: 'Creando cuenta de inversión...',
        success: () => {
          // Reset form on success
          setFormData({
            platform: '',
            account_number: '',
            aum: 0,
          });
          return '✅ ¡Cuenta de inversión creada con éxito!';
        },
        error: (err) => {
          const errorMessage = err instanceof Error ? err.message : 'No se pudo crear la cuenta';
          return `❌ Error: ${errorMessage}`;
        },
      });

      await submitPromise;
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        platform: '',
        account_number: '',
        aum: 0,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Cuenta de Inversión</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Input
              id="platform"
              placeholder="ej. Balanz, Decrypto, IOL"
              value={formData.platform}
              onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number">Número de Cuenta</Label>
            <Input
              id="account_number"
              placeholder="Opcional"
              value={formData.account_number}
              onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aum">AUM (Assets Under Management) *</Label>
            <Input
              id="aum"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.aum || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                aum: parseFloat(e.target.value) || 0 
              }))}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Monto en USD que el cliente tiene invertido en esta plataforma
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 