'use client';

import { useState, useEffect } from 'react';
import {
  Edit,
  Loader2,
  User,
  Target,
  Activity,
  StickyNote,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { ClientService, PortfolioService } from '@/services';
import {
  Client,
  ClientUpdate,
  RiskProfile,
  ClientStatus,
  LeadSource,
  ModelPortfolio,
} from '@/types';

interface EditClientDialogProps {
  client: Client;
  onClientUpdated?: () => void;
  trigger?: React.ReactNode;
}

// Estados optimizados alineados con pipeline
const CLIENT_STATUS_OPTIONS = [
  {
    value: ClientStatus.PROSPECT,
    label: 'Prospecto',
    description: 'Lead inicial sin contacto',
    color: 'text-purple-700',
  },
  {
    value: ClientStatus.CONTACTED,
    label: 'Contactado',
    description: 'Primer contacto realizado',
    color: 'text-blue-700',
  },
  {
    value: ClientStatus.FIRST_MEETING,
    label: 'Primera Reunión',
    description: 'Reunión inicial programada/realizada',
    color: 'text-indigo-700',
  },
  {
    value: ClientStatus.SECOND_MEETING,
    label: 'Segunda Reunión',
    description: 'Reunión de seguimiento',
    color: 'text-violet-700',
  },
  {
    value: ClientStatus.OPENING,
    label: 'Apertura',
    description: 'Proceso de apertura de cuenta',
    color: 'text-yellow-700',
  },
  {
    value: ClientStatus.RESCHEDULE,
    label: 'Reagendar',
    description: 'Pendiente de reprogramación',
    color: 'text-orange-700',
  },
  {
    value: ClientStatus.ACTIVE_INVESTOR,
    label: 'Cliente Activo',
    description: 'Cliente con inversiones activas',
    color: 'text-green-700',
  },
  {
    value: ClientStatus.ACTIVE_INSURED,
    label: 'Asegurado Activo',
    description: 'Cliente con pólizas de seguro activas',
    color: 'text-emerald-700',
  },
  {
    value: ClientStatus.DORMANT,
    label: 'Inactivo',
    description: 'Cliente inactivo o dormante',
    color: 'text-gray-700',
  },
];

const LEAD_SOURCE_OPTIONS = [
  { value: LeadSource.REFERRAL, label: 'Referido', icon: '👥' },
  { value: LeadSource.SOCIAL_MEDIA, label: 'Redes Sociales', icon: '📱' },
  { value: LeadSource.EVENT, label: 'Evento', icon: '🎯' },
  { value: LeadSource.ORGANIC, label: 'Búsqueda Orgánica', icon: '🔍' },
  { value: LeadSource.OTHER, label: 'Otro', icon: '📝' },
];

const RISK_PROFILE_OPTIONS = [
  {
    value: RiskProfile.LOW,
    label: 'Conservador',
    description: 'Riesgo Bajo - Preservación de capital',
    color: 'text-green-700',
  },
  {
    value: RiskProfile.MEDIUM,
    label: 'Moderado',
    description: 'Riesgo Medio - Balance crecimiento/estabilidad',
    color: 'text-yellow-700',
  },
  {
    value: RiskProfile.HIGH,
    label: 'Agresivo',
    description: 'Riesgo Alto - Máximo crecimiento',
    color: 'text-red-700',
  },
];

export function EditClientDialog({
  client,
  onClientUpdated,
  trigger,
}: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelPortfolios, setModelPortfolios] = useState<ModelPortfolio[]>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  const [formData, setFormData] = useState<ClientUpdate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.ORGANIC,
    notes: '',
    portfolio_name: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ClientUpdate, string>>
  >({});

  // Pre-populate form with client data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone || '',
        risk_profile: client.risk_profile,
        status: client.status,
        lead_source: client.lead_source,
        notes: client.notes || '',
        portfolio_name: client.portfolio_name || '',
      });
      setErrors({});
      loadModelPortfolios();
    }
  }, [open, client]);

  const loadModelPortfolios = async () => {
    try {
      setLoadingPortfolios(true);
      const portfolios = await PortfolioService.getModelPortfolios();
      setModelPortfolios(portfolios);
    } catch (error) {
      console.error('Error loading model portfolios:', error);
      // Continuar sin carteras modelo si hay error
      setModelPortfolios([]);
    } finally {
      setLoadingPortfolios(false);
    }
  };

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
      // Prepare data for backend - convert "none" to null for portfolio_name
      const dataToSubmit = {
        ...formData,
        portfolio_name:
          formData.portfolio_name === 'none'
            ? undefined
            : formData.portfolio_name,
      };

      const updatedClient = await ClientService.updateClient(
        client.id,
        dataToSubmit
      );
      setOpen(false);

      // Force browser cache invalidation for this client's data
      if (typeof window !== 'undefined') {
        // Clear any cached data for this client
        localStorage.removeItem(`client-${client.id}`);
        sessionStorage.removeItem(`client-${client.id}`);

        // Dispatch a global event to notify all components of client update
        window.dispatchEvent(
          new CustomEvent('client:updated', {
            detail: { clientId: client.id, updatedClient },
          })
        );
      }

      // Trigger callback to refresh client data
      if (onClientUpdated) {
        onClientUpdated();
      }

      // Additional safeguard: force a small delay to ensure backend commit is complete
      setTimeout(() => {
        if (onClientUpdated) {
          onClientUpdated();
        }
      }, 100);
    } catch (error) {
      console.error('Error updating client:', error);
      setErrors({
        email:
          error instanceof Error
            ? error.message
            : 'Error al actualizar el cliente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientUpdate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Filtrar carteras modelo por perfil de riesgo
  const filteredPortfolios = (modelPortfolios || []).filter(
    (portfolio) => portfolio.risk_profile === formData.risk_profile
  );

  const defaultTrigger = (
    <Button
      variant='outline'
      size='sm'
      className='border-cactus-300 text-cactus-700 hover:bg-cactus-50'
    >
      <Edit className='h-4 w-4' />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-cactus-800'>
            <Edit className='h-5 w-5' />
            Editar Cliente: {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            Modifique la información del cliente. Los campos marcados con * son
            obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-8 pt-6'>
          {/* Información Personal */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 border-b border-cactus-200 pb-2'>
              <User className='h-5 w-5 text-cactus-600' />
              <h4 className='text-lg font-semibold text-cactus-800'>
                Información Personal
              </h4>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='first_name'
                  className='text-sm font-medium text-cactus-700'
                >
                  Nombre *
                </Label>
                <Input
                  id='first_name'
                  placeholder='Ej: Giolivo'
                  value={formData.first_name || ''}
                  onChange={(e) =>
                    handleInputChange('first_name', e.target.value)
                  }
                  className={`border-cactus-200 focus:border-cactus-500 ${errors.first_name ? 'border-red-500' : ''}`}
                />
                {errors.first_name && (
                  <p className='text-sm text-red-600'>{errors.first_name}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='last_name'
                  className='text-sm font-medium text-cactus-700'
                >
                  Apellido *
                </Label>
                <Input
                  id='last_name'
                  placeholder='Ej: Santarelli'
                  value={formData.last_name || ''}
                  onChange={(e) =>
                    handleInputChange('last_name', e.target.value)
                  }
                  className={`border-cactus-200 focus:border-cactus-500 ${errors.last_name ? 'border-red-500' : ''}`}
                />
                {errors.last_name && (
                  <p className='text-sm text-red-600'>{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm font-medium text-cactus-700'
              >
                Email *
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='giolivo.santarelli@gmail.com'
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`border-cactus-200 focus:border-cactus-500 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className='text-sm text-red-600'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='phone'
                className='text-sm font-medium text-cactus-700'
              >
                Teléfono
              </Label>
              <Input
                id='phone'
                type='tel'
                placeholder='+52 555 123 4567'
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className='border-cactus-200 focus:border-cactus-500'
              />
            </div>
          </div>

          {/* Perfil de Inversión */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 border-b border-cactus-200 pb-2'>
              <Target className='h-5 w-5 text-cactus-600' />
              <h4 className='text-lg font-semibold text-cactus-800'>
                Perfil de Inversión
              </h4>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='risk_profile'
                  className='text-sm font-medium text-cactus-700'
                >
                  Perfil de Riesgo *
                </Label>
                <Select
                  value={formData.risk_profile || ''}
                  onValueChange={(value) =>
                    handleInputChange('risk_profile', value)
                  }
                >
                  <SelectTrigger className='border-cactus-200 focus:border-cactus-500'>
                    <SelectValue placeholder='Selecciona perfil de riesgo' />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_PROFILE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex flex-col'>
                          <span className={`font-medium ${option.color}`}>
                            {option.label}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='portfolio_name'
                  className='text-sm font-medium text-cactus-700'
                >
                  Cartera Modelo {filteredPortfolios.length > 0 && '*'}
                </Label>
                {loadingPortfolios ? (
                  <div className='flex items-center gap-2 rounded-md border border-cactus-200 p-3'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span className='text-sm text-muted-foreground'>
                      Cargando carteras...
                    </span>
                  </div>
                ) : filteredPortfolios.length > 0 ? (
                  <Select
                    value={formData.portfolio_name || ''}
                    onValueChange={(value) =>
                      handleInputChange('portfolio_name', value)
                    }
                  >
                    <SelectTrigger className='border-cactus-200 focus:border-cactus-500'>
                      <SelectValue placeholder='Selecciona una cartera modelo' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>
                        <span className='text-muted-foreground'>
                          Sin cartera asignada
                        </span>
                      </SelectItem>
                      {filteredPortfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.name}>
                          <div className='flex flex-col'>
                            <span className='font-medium'>
                              {portfolio.name}
                            </span>
                            {portfolio.description && (
                              <span className='text-xs text-muted-foreground'>
                                {portfolio.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className='rounded-md border border-sand-200 bg-sand-50 p-3'>
                    <p className='text-sm text-sand-700'>
                      No hay carteras modelo disponibles para el perfil{' '}
                      {
                        RISK_PROFILE_OPTIONS.find(
                          (opt) => opt.value === formData.risk_profile
                        )?.label
                      }
                      .
                    </p>
                    <p className='mt-1 text-xs text-sand-600'>
                      Puede crear carteras modelo en la sección Portfolios.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estado y Seguimiento */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 border-b border-cactus-200 pb-2'>
              <Activity className='h-5 w-5 text-cactus-600' />
              <h4 className='text-lg font-semibold text-cactus-800'>
                Estado y Seguimiento
              </h4>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='status'
                  className='text-sm font-medium text-cactus-700'
                >
                  Estado del Cliente
                </Label>
                <Select
                  value={formData.status || ''}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className='border-cactus-200 focus:border-cactus-500'>
                    <SelectValue placeholder='Selecciona estado' />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex flex-col'>
                          <span className={`font-medium ${option.color}`}>
                            {option.label}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='lead_source'
                  className='text-sm font-medium text-cactus-700'
                >
                  Fuente de Captación
                </Label>
                <Select
                  value={formData.lead_source || ''}
                  onValueChange={(value) =>
                    handleInputChange('lead_source', value)
                  }
                >
                  <SelectTrigger className='border-cactus-200 focus:border-cactus-500'>
                    <SelectValue placeholder='Fuente de captación' />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex items-center gap-2'>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2 border-b border-cactus-200 pb-2'>
              <StickyNote className='h-5 w-5 text-cactus-600' />
              <h4 className='text-lg font-semibold text-cactus-800'>
                Información Adicional
              </h4>
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='notes'
                className='text-sm font-medium text-cactus-700'
              >
                Notas Adicionales
              </Label>
              <Textarea
                id='notes'
                placeholder='Información adicional sobre el cliente...'
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className='min-h-[80px] border-cactus-200 focus:border-cactus-500'
              />
              <p className='text-xs text-muted-foreground'>
                Puede incluir detalles del perfil, preferencias de inversión, o
                cualquier información relevante.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3 border-t border-cactus-200 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className='border-cactus-300 text-cactus-700 hover:bg-cactus-50'
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
              className='gap-2 bg-cactus-600 text-white hover:bg-cactus-700'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Actualizando...
                </>
              ) : (
                <>
                  <Edit className='h-4 w-4' />
                  Actualizar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
