'use client';

import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';

interface AddInsurancePolicyDialogProps {
  clientId: number;
  onPolicyAdded?: () => void;
  trigger?: React.ReactNode;
}

interface FormData {
  policy_number: string;
  insurance_type: string;
  premium_amount: string;
  coverage_amount: string;
}

const INSURANCE_TYPES = [
  'Seguro de Vida',
  'Seguro de Retiro',
  'Seguro de Salud',
  'Seguro de Invalidez',
  'Seguro de Accidentes',
  'Seguro de Responsabilidad Civil',
  'Otro'
];

export function AddInsurancePolicyDialog({ 
  clientId, 
  onPolicyAdded, 
  trigger 
}: AddInsurancePolicyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    policy_number: '',
    insurance_type: '',
    premium_amount: '0',
    coverage_amount: '0',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.policy_number.trim()) {
      newErrors.policy_number = 'El número de póliza es obligatorio';
    }
    
    if (!formData.insurance_type.trim()) {
      newErrors.insurance_type = 'El tipo de seguro es obligatorio';
    }
    
    const premiumValue = parseFloat(formData.premium_amount);
    if (isNaN(premiumValue) || premiumValue < 0) {
      newErrors.premium_amount = 'La prima debe ser un número válido mayor o igual a 0';
    }
    
    const coverageValue = parseFloat(formData.coverage_amount);
    if (isNaN(coverageValue) || coverageValue <= 0) {
      newErrors.coverage_amount = 'La cobertura debe ser un número válido mayor a 0';
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
      await apiClient.createInsurancePolicy(clientId, {
        policy_number: formData.policy_number,
        insurance_type: formData.insurance_type,
        premium_amount: parseFloat(formData.premium_amount),
        coverage_amount: parseFloat(formData.coverage_amount),
      });
      
      // Reset form
      setFormData({
        policy_number: '',
        insurance_type: '',
        premium_amount: '0',
        coverage_amount: '0',
      });
      setErrors({});
      setOpen(false);
      
      // Trigger callback to refresh data
      if (onPolicyAdded) {
        onPolicyAdded();
      }
    } catch (error) {
      console.error('Error creating insurance policy:', error);
      setErrors({ 
        policy_number: error instanceof Error ? error.message : 'Error al crear la póliza de seguro'
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
      <Shield className="h-4 w-4" />
      Añadir Póliza de Seguro
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
            <Shield className="h-5 w-5" />
            Añadir Póliza de Seguro
          </DialogTitle>
          <DialogDescription>
            Añade una nueva póliza de seguro para este cliente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="policy_number">
              Número de Póliza *
            </Label>
            <Input
              id="policy_number"
              placeholder="Ej: POL-2024-001234"
              value={formData.policy_number}
              onChange={(e) => handleInputChange('policy_number', e.target.value)}
              className={errors.policy_number ? 'border-destructive' : ''}
            />
            {errors.policy_number && (
              <p className="text-sm text-destructive">{errors.policy_number}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="insurance_type">
              Tipo de Seguro *
            </Label>
            <Select 
              value={formData.insurance_type} 
              onValueChange={(value) => handleInputChange('insurance_type', value)}
            >
              <SelectTrigger className={errors.insurance_type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecciona el tipo de seguro" />
              </SelectTrigger>
              <SelectContent>
                {INSURANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.insurance_type && (
              <p className="text-sm text-destructive">{errors.insurance_type}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium_amount">
                Prima (Mensual/Anual) *
              </Label>
              <Input
                id="premium_amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.premium_amount}
                onChange={(e) => handleInputChange('premium_amount', e.target.value)}
                className={errors.premium_amount ? 'border-destructive' : ''}
              />
              {errors.premium_amount && (
                <p className="text-sm text-destructive">{errors.premium_amount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coverage_amount">
                Cobertura Total *
              </Label>
              <Input
                id="coverage_amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.coverage_amount}
                onChange={(e) => handleInputChange('coverage_amount', e.target.value)}
                className={errors.coverage_amount ? 'border-destructive' : ''}
              />
              {errors.coverage_amount && (
                <p className="text-sm text-destructive">{errors.coverage_amount}</p>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Valores en USD. La prima es el costo periódico y la cobertura es el monto total asegurado.
          </p>

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
                  <Shield className="h-4 w-4" />
                  Crear Póliza
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 