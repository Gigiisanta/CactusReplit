'use client';

import { useState, useEffect } from 'react';
import { Edit, Loader2 } from 'lucide-react';
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
import { Client, ClientUpdate, RiskProfile, ClientStatus, LeadSource } from '@/types';
import { FinancialProductsSection } from './financial-products-section';

interface EditClientDialogProps {
  client: Client;
  onClientUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function EditClientDialog({ client, onClientUpdated, trigger }: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientUpdate>({
    first_name: '',
    last_name: '',
    email: '',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.ORGANIC,
    notes: '',
    portfolio_name: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClientUpdate, string>>>({});

  // Pre-populate form with client data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        risk_profile: client.risk_profile,
        status: client.status,
        lead_source: client.lead_source,
        notes: client.notes || '',
        portfolio_name: client.portfolio_name || '',
      });
      setErrors({});
    }
  }, [open, client]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientUpdate, string>> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'El nombre es obligatorio';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'El apellido es obligatorio';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
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
      await apiClient.updateClient(client.id, formData);
      
      setErrors({});
      setOpen(false);
      
      // Trigger callback to refresh client list
      if (onClientUpdated) {
        onClientUpdated();
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setErrors({ 
        email: error instanceof Error ? error.message : 'Error al actualizar el cliente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="h-4 w-4" />
      Editar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Cliente: {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            Modifica la información del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información Personal
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Nombre *
                </Label>
                <Input
                  id="first_name"
                  placeholder="Ej: Juan"
                  value={formData.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={errors.first_name ? 'border-destructive' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Apellido *
                </Label>
                <Input
                  id="last_name"
                  placeholder="Ej: Pérez"
                  value={formData.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={errors.last_name ? 'border-destructive' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@ejemplo.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Investment Profile Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Perfil de Inversión
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk_profile">
                  Perfil de Riesgo *
                </Label>
                <Select 
                  value={formData.risk_profile} 
                  onValueChange={(value) => handleInputChange('risk_profile', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona perfil de riesgo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RiskProfile.LOW}>
                      Conservador - Riesgo Bajo
                    </SelectItem>
                    <SelectItem value={RiskProfile.MEDIUM}>
                      Moderado - Riesgo Medio
                    </SelectItem>
                    <SelectItem value={RiskProfile.HIGH}>
                      Agresivo - Riesgo Alto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio_name">
                  Cartera
                </Label>
                <Input
                  id="portfolio_name"
                  placeholder="Ej: Cartera Conservadora"
                  value={formData.portfolio_name || ''}
                  onChange={(e) => handleInputChange('portfolio_name', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Client Status Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Estado y Seguimiento
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Estado del Cliente
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClientStatus.PROSPECT}>
                      Prospecto
                    </SelectItem>
                    <SelectItem value={ClientStatus.CONTACTED}>
                      Contactado
                    </SelectItem>
                    <SelectItem value={ClientStatus.ONBOARDING}>
                      En Proceso
                    </SelectItem>
                    <SelectItem value={ClientStatus.ACTIVE_INVESTOR}>
                      Inversor Activo
                    </SelectItem>
                    <SelectItem value={ClientStatus.ACTIVE_INSURED}>
                      Asegurado Activo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lead_source">
                  Fuente de Captación
                </Label>
                <Select 
                  value={formData.lead_source} 
                  onValueChange={(value) => handleInputChange('lead_source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Cómo nos conoció?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LeadSource.REFERRAL}>
                      Referido
                    </SelectItem>
                    <SelectItem value={LeadSource.SOCIAL_MEDIA}>
                      Redes Sociales
                    </SelectItem>
                    <SelectItem value={LeadSource.EVENT}>
                      Evento
                    </SelectItem>
                    <SelectItem value={LeadSource.ORGANIC}>
                      Búsqueda Orgánica
                    </SelectItem>
                    <SelectItem value={LeadSource.OTHER}>
                      Otro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Financial Products Section */}
          <FinancialProductsSection 
            client={client} 
            onProductUpdate={onClientUpdated} 
          />

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información Adicional
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notas Adicionales
              </Label>
              <textarea
                id="notes"
                placeholder="Información adicional sobre el cliente..."
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>
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
                  Guardando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 