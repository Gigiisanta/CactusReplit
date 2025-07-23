'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Client, ClientStatus, LeadSource, RiskProfile } from '@/types';
import {
  User,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  Shield,
  UserCheck,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Briefcase,
  MessageCircle,
  Copy,
  Plus,
  AlertTriangle,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddInvestmentAccountDialog } from './AddInvestmentAccountDialog';
import { AddInsurancePolicyDialog } from './AddInsurancePolicyDialog';
import { ClientService } from '@/services/client.service';
import { PortfolioService } from '@/services/portfolio.service';
import { toast } from 'sonner';

interface ClientDetailsCardProps {
  client: Client;
  onClientUpdate: (client: Client) => void;
  onDataChange: () => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

interface ModelPortfolio {
  id: number;
  name: string;
  description: string | null;
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
}

const getStatusColor = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case ClientStatus.ACTIVE_INVESTOR:
      return 'bg-green-100 text-green-800 border-green-300';
    case ClientStatus.ACTIVE_INSURED:
      return 'bg-green-100 text-green-800 border-green-300';
    case ClientStatus.DORMANT:
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

const getStatusLabel = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'Prospecto';
    case ClientStatus.ACTIVE_INVESTOR:
      return 'Invirtiendo';
    case ClientStatus.ACTIVE_INSURED:
      return 'Asegurado';
    case ClientStatus.DORMANT:
      return 'Inactivo';
    default:
      return status;
  }
};

const getRiskProfileColor = (profile: string): string => {
  switch (profile) {
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

const getRiskProfileLabel = (profile: string): string => {
  switch (profile) {
    case 'LOW':
      return 'Conservador';
    case 'MEDIUM':
      return 'Moderado';
    case 'HIGH':
      return 'Agresivo';
    default:
      return profile;
  }
};

const getLeadSourceLabel = (source?: LeadSource): string => {
  if (!source) return 'No especificada';

  switch (source) {
    case LeadSource.REFERRAL:
      return 'Referido';
    case LeadSource.SOCIAL_MEDIA:
      return 'Redes Sociales';
    case LeadSource.EVENT:
      return 'Evento';
    case LeadSource.ORGANIC:
      return 'Orgánico';
    case LeadSource.OTHER:
      return 'Otro';
    default:
      return source;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function ClientDetailsCard({
  client,
  onClientUpdate,
  onDataChange,
  isEditing,
  onEditingChange,
  clientService = ClientService,
}: ClientDetailsCardProps & { clientService?: typeof ClientService }) {
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddPolicyModalOpen, setIsAddPolicyModalOpen] = useState(false);
  const [availablePortfolios, setAvailablePortfolios] = useState<
    ModelPortfolio[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone || '',
    risk_profile: client.risk_profile,
    status: client.status,
    lead_source: client.lead_source,
    notes: client.notes || '',
    portfolio_name: client.portfolio_name || 'none',
  });

  const totalAUM = (client.investment_accounts || []).reduce(
    (sum, acc) => sum + acc.aum,
    0
  );
  const totalInsurance = (client.insurance_policies || []).reduce(
    (sum, policy) => sum + policy.coverage_amount,
    0
  );
  const totalPremiums = (client.insurance_policies || []).reduce(
    (sum, policy) => sum + policy.premium_amount,
    0
  );
  const totalProducts =
    (client.investment_accounts?.length || 0) +
    (client.insurance_policies?.length || 0);

  // Verificar información incompleta
  const missingInfo = [];
  if (!client.phone) missingInfo.push('teléfono');
  if (!client.notes) missingInfo.push('notas');
  if (!client.portfolio_name) missingInfo.push('portafolio');
  if (!client.risk_profile) missingInfo.push('perfil de riesgo');

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // Notify that save is starting
    const startEvent = new CustomEvent('client:saving');
    window.dispatchEvent(startEvent);

    try {
      // Prepare data for backend - convert "none" to null for portfolio_name
      const dataToSubmit = {
        ...formData,
        portfolio_name:
          formData.portfolio_name === 'none'
            ? undefined
            : formData.portfolio_name,
      };

      const updatedClient = await clientService.updateClient(
        client.id,
        dataToSubmit
      );
      onClientUpdate(updatedClient);

      // Notify that save is complete so page.tsx can handle state changes
      const event = new CustomEvent('client:saved');
      window.dispatchEvent(event);

      toast.success('Cliente actualizado correctamente');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('No se pudo actualizar la información del cliente');
    } finally {
      setIsSaving(false);
    }
  }, [formData, client.id, onClientUpdate, clientService]);

  const handleCancel = useCallback(() => {
    setFormData({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || '',
      risk_profile: client.risk_profile,
      status: client.status,
      lead_source: client.lead_source,
      notes: client.notes || '',
      portfolio_name: client.portfolio_name || 'none',
    });
    // Note: onEditingChange is now handled by page.tsx through events
  }, [client]);

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone || '',
        risk_profile: client.risk_profile,
        status: client.status,
        lead_source: client.lead_source,
        notes: client.notes || '',
        portfolio_name: client.portfolio_name || 'none',
      });
    }
  }, [client, isEditing]);

  // Listen for events from ClientHeader
  useEffect(() => {
    const handleSaveEvent = () => {
      if (isEditing) {
        handleSave();
      }
    };

    const handleCancelEvent = () => {
      handleCancel();
    };

    window.addEventListener('client:save', handleSaveEvent);
    window.addEventListener('client:cancel', handleCancelEvent);

    return () => {
      window.removeEventListener('client:save', handleSaveEvent);
      window.removeEventListener('client:cancel', handleCancelEvent);
    };
  }, [isEditing, formData, client, handleSave, handleCancel]);

  const loadPortfolios = async () => {
    try {
      const portfolios = await PortfolioService.getModelPortfolios();
      setAvailablePortfolios(portfolios);
    } catch (error) {
      console.error('Error loading portfolios:', error);
    }
  };

  const handleAddAccount = async () => {
    try {
      // Only call onDataChange after successful operation
      if (onDataChange) {
        await onDataChange();
      }
      setIsAddAccountModalOpen(false);
    } catch (error) {
      console.error('Error refreshing data after adding account:', error);
    }
  };

  const handleAddPolicy = async () => {
    try {
      // Only call onDataChange after successful operation
      if (onDataChange) {
        await onDataChange();
      }
      setIsAddPolicyModalOpen(false);
    } catch (error) {
      console.error('Error refreshing data after adding policy:', error);
    }
  };

  return (
    <>
      <Card className='border-slate-200 bg-white shadow-sm'>
        <CardHeader className='border-b border-slate-100 pb-6'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-3 text-xl text-slate-900'>
              <User className='h-5 w-5 text-slate-600' />
              Información del Cliente
            </CardTitle>
            {/* Botones movidos a ClientHeader */}
          </div>
        </CardHeader>

        <CardContent className='space-y-8 p-6'>
          {/* Warning para información incompleta */}
          {missingInfo.length > 0 && !isEditing && (
            <Alert variant='warning'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Información incompleta:</strong> Faltan datos de{' '}
                {missingInfo.join(', ')}.
              </AlertDescription>
            </Alert>
          )}

          {/* Información básica */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-gray-900'>
                Información Personal
              </h3>
            </div>

            <div className='space-y-3'>
              {/* Nombre */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='flex min-h-[60px] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4'>
                  <User className='h-4 w-4 flex-shrink-0 text-slate-500' />
                  <div className='min-w-0 flex-1'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-600'>
                      Nombre
                    </p>
                    {isEditing ? (
                      <Input
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'
                        placeholder='Nombre'
                      />
                    ) : (
                      <p className='truncate text-sm font-medium text-slate-900'>
                        {client.first_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex min-h-[60px] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4'>
                  <User className='h-4 w-4 flex-shrink-0 text-slate-500' />
                  <div className='min-w-0 flex-1'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-600'>
                      Apellido
                    </p>
                    {isEditing ? (
                      <Input
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'
                        placeholder='Apellido'
                      />
                    ) : (
                      <p className='truncate text-sm font-medium text-slate-900'>
                        {client.last_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className='flex min-h-[60px] items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4'>
                <div className='flex min-w-0 flex-1 items-center gap-3'>
                  <Mail className='h-4 w-4 flex-shrink-0 text-slate-500' />
                  <div className='min-w-0 flex-1'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-600'>
                      Email
                    </p>
                    {isEditing ? (
                      <Input
                        type='email'
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'
                        placeholder='email@ejemplo.com'
                      />
                    ) : (
                      <p className='truncate text-sm font-medium text-slate-900'>
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <div className='ml-2 flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        navigator.clipboard.writeText(client.email)
                      }
                      className='h-8 w-8 p-0 hover:bg-slate-200'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        window.open(`mailto:${client.email}`, '_blank')
                      }
                    >
                      <ExternalLink className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div className='flex min-h-[60px] items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4'>
                <div className='flex min-w-0 flex-1 items-center gap-3'>
                  <Phone className='h-4 w-4 flex-shrink-0 text-slate-500' />
                  <div className='min-w-0 flex-1'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-600'>
                      Teléfono
                    </p>
                    {isEditing ? (
                      <Input
                        type='tel'
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder='+52 555 123 4567'
                        className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'
                      />
                    ) : client.phone ? (
                      <p className='truncate text-sm font-medium text-slate-900'>
                        {client.phone}
                      </p>
                    ) : (
                      <p className='text-sm text-slate-500'>No especificado</p>
                    )}
                  </div>
                </div>
                {!isEditing && client.phone && (
                  <div className='ml-2 flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        navigator.clipboard.writeText(client.phone || '')
                      }
                      className='h-8 w-8 p-0 hover:bg-slate-200'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        window.open(
                          `https://wa.me/${client.phone?.replace(/\D/g, '') || ''}`,
                          '_blank'
                        )
                      }
                      className='h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700'
                    >
                      <MessageCircle className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>

              {/* Perfil de Riesgo y Fuente */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='flex min-h-[60px] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4'>
                  <Shield className='h-4 w-4 flex-shrink-0 text-slate-500' />
                  <div className='min-w-0 flex-1'>
                    <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-600'>
                      Perfil de Riesgo
                    </p>
                    {isEditing ? (
                      <Select
                        value={formData.risk_profile}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            risk_profile: value as RiskProfile,
                          })
                        }
                      >
                        <SelectTrigger className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'>
                          <SelectValue placeholder='Seleccionar' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='LOW'>Conservador</SelectItem>
                          <SelectItem value='MEDIUM'>Moderado</SelectItem>
                          <SelectItem value='HIGH'>Agresivo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant='outline'
                        className={`${getRiskProfileColor(client.risk_profile)} font-medium`}
                      >
                        {getRiskProfileLabel(client.risk_profile)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
                  <Target className='h-4 w-4 text-slate-400' />
                  <div className='flex-1'>
                    <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                      Fuente
                    </p>
                    {isEditing ? (
                      <Select
                        value={formData.lead_source}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            lead_source: value as LeadSource,
                          })
                        }
                      >
                        <SelectTrigger className='mt-1 h-7 text-sm'>
                          <SelectValue placeholder='Seleccionar' />
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
                            Orgánico
                          </SelectItem>
                          <SelectItem value={LeadSource.OTHER}>Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className='text-sm font-medium text-slate-900'>
                        {getLeadSourceLabel(client.lead_source)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cliente desde */}
              <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-3'>
                <Calendar className='h-4 w-4 text-slate-400' />
                <div>
                  <p className='text-xs font-medium uppercase tracking-wide text-slate-500'>
                    Cliente desde
                  </p>
                  <p className='text-sm font-medium text-slate-900'>
                    {formatDate(client.created_at)}
                  </p>
                </div>
              </div>

              {/* Portfolio */}
              <div className='flex items-center gap-3 rounded-lg bg-blue-50 p-3'>
                <Briefcase className='h-4 w-4 text-blue-600' />
                <div className='flex-1'>
                  <p className='text-xs font-medium uppercase tracking-wide text-blue-600'>
                    Portafolio Asignado
                  </p>
                  {isEditing ? (
                    <Select
                      value={formData.portfolio_name}
                      onValueChange={(value) =>
                        setFormData({ ...formData, portfolio_name: value })
                      }
                    >
                      <SelectTrigger className='h-8 border-slate-200 bg-white text-sm focus:border-cactus-500'>
                        <SelectValue placeholder='Seleccionar cartera' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>Sin asignar</SelectItem>
                        {availablePortfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.name}>
                            {portfolio.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : client.portfolio_name ? (
                    <p className='text-sm font-medium text-blue-900'>
                      {client.portfolio_name}
                    </p>
                  ) : (
                    <p className='text-sm text-blue-700'>Sin asignar</p>
                  )}
                </div>
              </div>

              {/* Notas */}
              {(isEditing || client.notes) && (
                <div className='rounded-lg border border-slate-100 bg-slate-50 p-4'>
                  <p className='mb-3 text-xs font-medium uppercase tracking-wide text-slate-600'>
                    Notas del Cliente
                  </p>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className='min-h-[80px] border-slate-200 bg-white text-sm focus:border-cactus-500'
                      placeholder='Notas adicionales sobre el cliente...'
                      rows={3}
                    />
                  ) : client.notes ? (
                    <p className='text-sm leading-relaxed text-slate-700'>
                      {client.notes}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <Separator className='my-4' />

          {/* Métricas financieras con botones */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {/* AUM Total Card */}
            <div className='flex min-h-[120px] flex-col rounded-lg border border-green-200 bg-green-50 p-4'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex flex-1 items-center gap-2'>
                  <TrendingUp className='h-4 w-4 flex-shrink-0 text-green-600' />
                  <p className='text-xs font-medium uppercase leading-tight tracking-wide text-green-700'>
                    AUM Total
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsAddAccountModalOpen(true)}
                  className='ml-2 h-8 flex-shrink-0 border-green-300 px-3 text-xs text-green-700 hover:bg-green-100'
                >
                  <Plus className='mr-1 h-3 w-3' />
                  <span className='hidden sm:inline'>Agregar</span>
                  <span className='sm:hidden'>+</span>
                </Button>
              </div>
              <div className='flex flex-1 flex-col justify-center'>
                <p className='text-2xl font-bold leading-none text-green-900'>
                  {formatCurrency(totalAUM)}
                </p>
                <p className='mt-2 text-xs text-green-700'>
                  {(client.investment_accounts || []).length}{' '}
                  {(client.investment_accounts || []).length === 1
                    ? 'Cuenta'
                    : 'Cuentas'}
                </p>
              </div>
            </div>

            {/* Cobertura Seguros Card */}
            <div className='flex min-h-[120px] flex-col rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex flex-1 items-center gap-2'>
                  <Shield className='h-4 w-4 flex-shrink-0 text-blue-600' />
                  <p className='text-xs font-medium uppercase leading-tight tracking-wide text-blue-700'>
                    Cobertura Seguros
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsAddPolicyModalOpen(true)}
                  className='ml-2 h-8 flex-shrink-0 border-blue-300 px-3 text-xs text-blue-700 hover:bg-blue-100'
                >
                  <Plus className='mr-1 h-3 w-3' />
                  <span className='hidden sm:inline'>Agregar</span>
                  <span className='sm:hidden'>+</span>
                </Button>
              </div>
              <div className='flex flex-1 flex-col justify-center'>
                <p className='text-2xl font-bold leading-none text-blue-900'>
                  {formatCurrency(totalInsurance)}
                </p>
                <p className='mt-2 text-xs text-blue-700'>
                  {(client.insurance_policies || []).length}{' '}
                  {(client.insurance_policies || []).length === 1
                    ? 'Póliza'
                    : 'Pólizas'}{' '}
                  • Primas: {formatCurrency(totalPremiums)}
                </p>
              </div>
            </div>

            {/* Productos Activos Card */}
            <div className='flex min-h-[120px] flex-col rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1'>
              <div className='mb-3 flex items-center gap-2'>
                <Briefcase className='h-4 w-4 flex-shrink-0 text-slate-600' />
                <p className='text-xs font-medium uppercase leading-tight tracking-wide text-slate-700'>
                  Productos Activos
                </p>
              </div>
              <div className='flex flex-1 flex-col justify-center'>
                <p className='text-2xl font-bold leading-none text-slate-900'>
                  {totalProducts}
                </p>
                <p className='mt-2 text-xs text-slate-700'>
                  {(client.investment_accounts || []).length}{' '}
                  {(client.investment_accounts || []).length === 1
                    ? 'Cuenta'
                    : 'Cuentas'}{' '}
                  • {(client.insurance_policies || []).length}{' '}
                  {(client.insurance_policies || []).length === 1
                    ? 'Póliza'
                    : 'Pólizas'}
                </p>
              </div>
            </div>
          </div>

          {/* Información de referido */}
          {client.referred_by_client_id && (
            <>
              <Separator className='my-4' />
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                <div className='flex items-center gap-2'>
                  <UserCheck className='h-4 w-4 text-blue-600' />
                  <div>
                    <p className='text-xs font-medium uppercase tracking-wide text-blue-700'>
                      Cliente Referido
                    </p>
                    <p className='text-sm font-medium text-blue-900'>
                      Referido por Cliente ID: {client.referred_by_client_id}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Acciones rápidas */}
          {!isEditing && (
            <>
              <Separator className='my-4' />
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-gray-900'>
                    Acciones Rápidas
                  </h4>
                </div>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-10 justify-start border-green-200 text-green-700 hover:bg-green-50'
                    onClick={() =>
                      window.open(`mailto:${client.email}`, '_blank')
                    }
                  >
                    <Mail className='mr-2 h-4 w-4 flex-shrink-0' />
                    <span className='truncate'>Email</span>
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    className='h-10 justify-start border-blue-200 text-blue-700 hover:bg-blue-50'
                    onClick={() => {
                      const clientName = `${client.first_name} ${client.last_name}`;
                      const calendarUrl = new URL(
                        'https://calendar.google.com/calendar/render'
                      );
                      calendarUrl.searchParams.set('action', 'TEMPLATE');
                      calendarUrl.searchParams.set(
                        'text',
                        `Reunión con ${clientName}`
                      );
                      calendarUrl.searchParams.set(
                        'details',
                        `Reunión con cliente: ${clientName}\nEmail: ${client.email}${client.phone ? `\nTeléfono: ${client.phone}` : ''}`
                      );
                      calendarUrl.searchParams.set('add', client.email);
                      calendarUrl.searchParams.set('dates', '');
                      calendarUrl.searchParams.set(
                        'ctz',
                        'America/Mexico_City'
                      );
                      window.open(calendarUrl.toString(), '_blank');
                    }}
                  >
                    <Calendar className='mr-2 h-4 w-4 flex-shrink-0' />
                    <span className='truncate'>Reunión</span>
                  </Button>

                  {client.phone && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-10 justify-start border-green-200 text-green-700 hover:bg-green-50'
                      onClick={() =>
                        window.open(
                          `https://wa.me/${client.phone?.replace(/\D/g, '') || ''}`,
                          '_blank'
                        )
                      }
                    >
                      <MessageCircle className='mr-2 h-4 w-4 flex-shrink-0' />
                      <span className='truncate'>WhatsApp</span>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Timestamp de última actualización */}
          <div className='border-t border-slate-100 pt-2'>
            <div className='flex items-center gap-2 text-xs text-slate-500'>
              <Clock className='h-3 w-3' />
              <span>
                Última actualización: {formatDateShort(client.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <AddInvestmentAccountDialog
        open={isAddAccountModalOpen}
        onOpenChange={setIsAddAccountModalOpen}
        onSubmit={handleAddAccount}
      />

      <AddInsurancePolicyDialog
        open={isAddPolicyModalOpen}
        onOpenChange={setIsAddPolicyModalOpen}
        onSubmit={handleAddPolicy}
      />
    </>
  );
}
