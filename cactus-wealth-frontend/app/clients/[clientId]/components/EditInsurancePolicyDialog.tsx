'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InsurancePolicy } from '@/types';

interface EditInsurancePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: InsurancePolicy;
  onSubmit: (data: {
    policy_number?: string;
    insurance_type?: string;
    premium_amount?: number;
    coverage_amount?: number;
  }) => void;
}

export function EditInsurancePolicyDialog({ 
  open, 
  onOpenChange, 
  policy,
  onSubmit 
}: EditInsurancePolicyDialogProps) {
  const [formData, setFormData] = useState({
    policy_number: '',
    insurance_type: '',
    premium_amount: 0,
    coverage_amount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with policy data
  useEffect(() => {
    if (policy) {
      setFormData({
        policy_number: policy.policy_number,
        insurance_type: policy.insurance_type,
        premium_amount: policy.premium_amount,
        coverage_amount: policy.coverage_amount,
      });
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.policy_number.trim()) {
      toast.error('El número de póliza es requerido');
      return;
    }

    if (!formData.insurance_type.trim()) {
      toast.error('El tipo de seguro es requerido');
      return;
    }

    if (formData.premium_amount <= 0) {
      toast.error('La prima debe ser mayor a 0');
      return;
    }

    if (formData.coverage_amount <= 0) {
      toast.error('La cobertura debe ser mayor a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        policy_number: formData.policy_number.trim(),
        insurance_type: formData.insurance_type.trim(),
        premium_amount: formData.premium_amount,
        coverage_amount: formData.coverage_amount,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Póliza de Seguro</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-policy_number">Número de Póliza *</Label>
            <Input
              id="edit-policy_number"
              placeholder="ej. POL-001-2024"
              value={formData.policy_number}
              onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-insurance_type">Tipo de Seguro *</Label>
            <Input
              id="edit-insurance_type"
              placeholder="ej. Seguro de Vida, Seguro de Retiro"
              value={formData.insurance_type}
              onChange={(e) => setFormData(prev => ({ ...prev, insurance_type: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-premium_amount">Prima (USD) *</Label>
            <Input
              id="edit-premium_amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.premium_amount || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                premium_amount: parseFloat(e.target.value) || 0 
              }))}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Monto de la prima mensual o anual
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-coverage_amount">Cobertura (USD) *</Label>
            <Input
              id="edit-coverage_amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.coverage_amount || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                coverage_amount: parseFloat(e.target.value) || 0 
              }))}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Monto total de cobertura de la póliza
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 