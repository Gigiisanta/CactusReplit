'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client, ClientStatus, LeadSource } from '@/types';
import { Mail, Calendar, User, Phone, ExternalLink, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useState } from 'react';

// Create a separate component for the status cell
function StatusCell({
  status,
  clientId,
  onClientUpdated,
}: {
  status: ClientStatus;
  clientId: number;
  onClientUpdated?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const statusOptions = [
    ClientStatus.PROSPECT,
    ClientStatus.CONTACTED,
    ClientStatus.FIRST_MEETING,
    ClientStatus.SECOND_MEETING,
    ClientStatus.OPENING,
    ClientStatus.RESCHEDULE,
    ClientStatus.ACTIVE_INVESTOR,
    ClientStatus.ACTIVE_INSURED,
    ClientStatus.DORMANT,
  ];

  const handleStatusChange = async (newStatus: ClientStatus) => {
    setLoading(true);
    try {
      await apiClient.updateClient(clientId, { status: newStatus });
      setCurrentStatus(newStatus);
      setEditing(false);
      onClientUpdated?.();
    } catch (e) {
      // TODO: feedback error
    } finally {
      setLoading(false);
    }
  };

  return editing ? (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={loading}
    >
      <SelectTrigger className='h-8 min-w-[120px] border-slate-200 bg-white text-sm'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {getStatusLabel(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Badge
      className={`${getStatusColor(currentStatus)} cursor-pointer font-medium`}
      onClick={() => setEditing(true)}
    >
      {getStatusLabel(currentStatus)}
    </Badge>
  );
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusColor = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case ClientStatus.CONTACTED:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case ClientStatus.FIRST_MEETING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case ClientStatus.SECOND_MEETING:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case ClientStatus.OPENING:
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case ClientStatus.RESCHEDULE:
      return 'bg-red-100 text-red-800 border-red-300';
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
    case ClientStatus.CONTACTED:
      return 'Contactado';
    case ClientStatus.FIRST_MEETING:
      return 'Primera Reunión';
    case ClientStatus.SECOND_MEETING:
      return 'Segunda Reunión';
    case ClientStatus.OPENING:
      return 'Apertura';
    case ClientStatus.RESCHEDULE:
      return 'Reprogramar';
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

export const createColumns = (
  onClientUpdated: () => void
): ColumnDef<Client>[] => [
  {
    accessorKey: 'name',
    header: 'Cliente',
    cell: ({ row }) => {
      const client = row.original;
      const fullName = `${client.first_name} ${client.last_name}`;
      const totalAUM = (client.investment_accounts || []).reduce(
        (sum, acc) => sum + acc.aum,
        0
      );

      return (
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100'>
            <User className='h-5 w-5 text-slate-600' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate font-medium text-slate-900'>{fullName}</p>
            <div className='flex items-center gap-2 text-sm text-slate-500'>
              <Mail className='h-3 w-3' />
              <span className='truncate'>{client.email}</span>
            </div>
            {client.phone && (
              <div className='flex items-center gap-2 text-sm text-slate-500'>
                <Phone className='h-3 w-3' />
                <span>{client.phone}</span>
              </div>
            )}
            {totalAUM > 0 && (
              <p className='text-sm font-medium text-green-600'>
                AUM: {formatCurrency(totalAUM)}
              </p>
            )}
          </div>
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 hover:bg-slate-100'
              onClick={() => navigator.clipboard.writeText(client.email)}
            >
              <Copy className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 hover:bg-slate-100'
              onClick={() => window.open(`mailto:${client.email}`, '_blank')}
            >
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue, row }) => {
      const status = getValue() as ClientStatus;
      const clientId = row.original.id;

      return (
        <StatusCell
          status={status}
          clientId={clientId}
          onClientUpdated={onClientUpdated}
        />
      );
    },
  },

  {
    accessorKey: 'risk_profile',
    header: 'Perfil de Riesgo',
    cell: ({ getValue }) => {
      const profile = getValue() as string;
      return (
        <Badge
          variant='outline'
          className={`${getRiskProfileColor(profile)} font-medium`}
        >
          {getRiskProfileLabel(profile)}
        </Badge>
      );
    },
  },

  {
    accessorKey: 'portfolio_name',
    header: 'Cartera Asignada',
    cell: ({ getValue }) => {
      const portfolioName = getValue() as string | undefined;
      if (!portfolioName) {
        return (
          <div className='flex items-center gap-2 text-slate-500'>
            <div className='h-2 w-2 rounded-full bg-slate-300'></div>
            <span className='text-sm'>Sin cartera</span>
          </div>
        );
      }

      return (
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 rounded-full bg-green-500'></div>
          <span className='text-sm font-medium text-slate-900'>
            {portfolioName}
          </span>
        </div>
      );
    },
  },

  {
    id: 'products_summary',
    accessorFn: (row) => {
      const investmentCount = row.investment_accounts?.length || 0;
      const insuranceCount = row.insurance_policies?.length || 0;
      return { investmentCount, insuranceCount };
    },
    header: 'Productos',
    cell: ({ getValue }) => {
      const { investmentCount, insuranceCount } = getValue() as {
        investmentCount: number;
        insuranceCount: number;
      };
      const totalProducts = investmentCount + insuranceCount;

      if (totalProducts === 0) {
        return <div className='text-sm text-slate-500'>Sin productos</div>;
      }

      return (
        <div className='space-y-1'>
          {investmentCount > 0 && (
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 rounded-full bg-green-500'></div>
              <span className='text-sm text-slate-700'>
                {investmentCount} Inversión{investmentCount > 1 ? 'es' : ''}
              </span>
            </div>
          )}
          {insuranceCount > 0 && (
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 rounded-full bg-blue-500'></div>
              <span className='text-sm text-slate-700'>
                {insuranceCount} Seguro{insuranceCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: 'created_at',
    header: 'Cliente Desde',
    cell: ({ getValue }) => {
      const date = getValue() as string;
      return (
        <div className='flex items-center gap-2 text-sm text-slate-600'>
          <Calendar className='h-3 w-3' />
          {formatDate(date)}
        </div>
      );
    },
  },

  {
    accessorKey: 'lead_source',
    header: 'Fuente',
    cell: ({ getValue }) => {
      const source = getValue() as LeadSource | undefined;
      return (
        <span className='text-sm font-medium text-slate-700'>
          {getLeadSourceLabel(source)}
        </span>
      );
    },
  },

  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 hover:bg-green-50'
            onClick={() => {
              // TODO: Implementar acción de contactar
              console.log('Contactar cliente:', row.original.id);
            }}
          >
            <Mail className='h-4 w-4 text-green-600' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 hover:bg-slate-50'
            onClick={() => {
              // TODO: Implementar acción de ver detalles
              window.location.href = `/clients/${row.original.id}`;
            }}
          >
            <ExternalLink className='h-4 w-4' />
          </Button>
        </div>
      );
    },
  },
];
