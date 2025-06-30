'use client';

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { ClientService } from '@/services';
import { Client, ClientCreate, RiskProfile, ClientStatus, LeadSource } from '@/types';
import { FinancialProductsSection } from './financial-products-section';

interface AddClientDialogProps {
  onClientAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddClientDialog({ onClientAdded, trigger }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [newClient, setNewClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientCreate>({
    first_name: '',
    last_name: '',
    email: '',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.ORGANIC,
    notes: '',
    portfolio_name: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClientCreate, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientCreate, string>> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es obligatorio';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es obligatorio';
    }
    if (!formData.email.trim()) {
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
      const newClientData = await ClientService.createClient(formData);
      
      // Save the newly created client and move to step 2
      setNewClient(newClientData);
      setStep(2);
      setErrors({});
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ 
        email: error instanceof Error ? error.message : 'Error al crear el cliente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    // Reset wizard state
    setStep(1);
    setNewClient(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      risk_profile: RiskProfile.MEDIUM,
      status: ClientStatus.PROSPECT,
      lead_source: LeadSource.ORGANIC,
      notes: '',
      portfolio_name: '',
    });
    setErrors({});
    setOpen(false);
    
    // Trigger callback to refresh client list
    if (onClientAdded) {
      onClientAdded();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset wizard when closing
      setStep(1);
      setNewClient(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        risk_profile: RiskProfile.MEDIUM,
        status: ClientStatus.PROSPECT,
        lead_source: LeadSource.ORGANIC,
        notes: '',
        portfolio_name: '',
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof ClientCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <PlusCircle className="h-4 w-4" />
      Añadir Cliente
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            {step === 1 
              ? "Añadir Nuevo Cliente - Paso 1" 
              : `Añadir Productos para ${newClient?.first_name} ${newClient?.last_name}`
            }
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Completa la información del cliente para añadirlo a tu cartera. Los campos marcados con * son obligatorios."
              : "Ahora puedes añadir productos financieros al cliente recién creado. Esto es opcional."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
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
                  value={formData.first_name}
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
                  value={formData.last_name}
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
                value={formData.email}
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
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  💡
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    ¿Sabías que puedes añadir productos financieros después?
                  </p>
                  <p className="text-xs text-blue-700">
                    Una vez creado el cliente, podrás gestionar sus cuentas de inversión y pólizas de seguro 
                    directamente desde la tabla de clientes usando el botón &quot;Editar&quot;.
                  </p>
                </div>
              </div>
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
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Crear Cliente
                </>
              )}
            </Button>
          </div>
        </form>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Step 2: Financial Products */}
            {newClient && (
              <FinancialProductsSection 
                client={newClient} 
                onProductUpdate={() => {
                  // Refresh client data if needed
                  // For now, we just keep the local state
                }} 
              />
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  ✅
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    ¡Cliente creado exitosamente!
                  </p>
                  <p className="text-xs text-green-700">
                    Puedes añadir productos financieros ahora o hacerlo más tarde desde la tabla de clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons for Step 2 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Volver
              </Button>
              <Button 
                type="button" 
                onClick={handleFinish}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 