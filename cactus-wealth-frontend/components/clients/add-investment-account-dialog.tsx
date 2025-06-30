'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';

interface AddInvestmentAccountDialogProps {
  clientId: number;
  onAccountAdded?: () => void;
  trigger?: React.ReactNode;
}

interface FormData {
  platform: string;
  account_number: string;
  aum: string;
}

export function AddInvestmentAccountDialog({ 
  clientId, 
  onAccountAdded, 
  trigger 
}: AddInvestmentAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    platform: '',
    account_number: '',
    aum: '0',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.platform.trim()) {
      newErrors.platform = 'La plataforma es obligatoria';
    }
    
    const aumValue = parseFloat(formData.aum);
    if (isNaN(aumValue) || aumValue < 0) {
      newErrors.aum = 'El AUM debe ser un número válido mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createInvestmentAccount(clientId, {
        platform: formData.platform,
        account_number: formData.account_number || undefined,
        aum: parseFloat(formData.aum),
      });
      
      // Reset form
      setFormData({
        platform: '',
        account_number: '',
        aum: '0',
      });
      setErrors({});
      setOpen(false);
      
      // Trigger callback to refresh data
      if (onAccountAdded) {
        onAccountAdded();
      }
    } catch (error) {
      console.error('Error creating investment account:', error);
      setErrors({ 
        platform: error instanceof Error ? error.message : 'Error al crear la cuenta de inversión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Añadir Cuenta de Inversión
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Añadir Cuenta de Inversión
          </DialogTitle>
          <DialogDescription>
            Añade una nueva cuenta de inversión para este cliente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="platform">
              Plataforma / Broker *
            </Label>
            <Input
              id="platform"
              placeholder="Ej: Balanz, Decrypto, Rava Bursátil"
              value={formData.platform}
              onChange={(e) => handleInputChange('platform', e.target.value)}
              className={errors.platform ? 'border-destructive' : ''}
            />
            {errors.platform && (
              <p className="text-sm text-destructive">{errors.platform}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account_number">
              Número de Cuenta (Opcional)
            </Label>
            <Input
              id="account_number"
              placeholder="Ej: 123456789"
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aum">
              AUM (Activos Bajo Gestión) *
            </Label>
            <Input
              id="aum"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={formData.aum}
              onChange={(e) => handleInputChange('aum', e.target.value)}
              className={errors.aum ? 'border-destructive' : ''}
            />
            {errors.aum && (
              <p className="text-sm text-destructive">{errors.aum}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Valor en USD de los activos administrados en esta cuenta
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 