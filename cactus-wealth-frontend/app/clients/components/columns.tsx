'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Client, ClientStatus, LeadSource } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';

const getStatusColor = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case ClientStatus.CONTACTED:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case ClientStatus.ONBOARDING:
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case ClientStatus.ACTIVE_INVESTOR:
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case ClientStatus.ACTIVE_INSURED:
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    case ClientStatus.DORMANT:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusLabel = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.PROSPECT:
      return 'Prospecto';
    case ClientStatus.CONTACTED:
      return 'Contactado';
    case ClientStatus.ONBOARDING:
      return 'En Apertura';
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

export const createColumns = (onClientUpdated: () => void): ColumnDef<Client>[] => [
  {
    id: 'fullName',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ getValue, row }) => {
      const fullName = getValue() as string;
      return (
        <div className="flex flex-col">
          <Link 
            href={`/clients/${row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {fullName}
          </Link>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      );
    },
  },
  
  {
    accessorKey: 'portfolio_name',
    header: 'Cartera',
    cell: ({ getValue }) => {
      const portfolioName = getValue() as string | undefined;
      if (!portfolioName) {
        return <span className="text-muted-foreground text-sm">Sin cartera</span>;
      }
      
      return (
        <span className="text-sm font-medium">
          {portfolioName}
        </span>
      );
    },
  },
  
  {
    id: 'products',
    accessorFn: (row) => {
      const products = [];
      if (row.investment_accounts?.length) {
        products.push(...row.investment_accounts.map(acc => acc.platform));
      }
      if (row.insurance_policies?.length) {
        products.push(...row.insurance_policies.map(policy => policy.insurance_type));
      }
      return products;
    },
    header: 'Producto(s)',
    cell: ({ getValue }) => {
      const products = getValue() as string[];
      if (!products.length) {
        return <span className="text-muted-foreground text-sm">Sin productos</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {products.slice(0, 3).map((product, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {product}
            </Badge>
          ))}
          {products.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{products.length - 3} más
            </Badge>
          )}
        </div>
      );
    },
  },
  
  {
    accessorKey: 'notes',
    header: 'Descripción',
    cell: ({ getValue }) => {
      const notes = getValue() as string | undefined;
      if (!notes) {
        return <span className="text-muted-foreground text-sm">Sin notas</span>;
      }
      
      const truncated = notes.length > 60 ? `${notes.substring(0, 60)}...` : notes;
      return (
        <div className="max-w-[200px]">
          <span className="text-sm" title={notes}>
            {truncated}
          </span>
        </div>
      );
    },
  },
  
  {
    id: 'referredBy',
    accessorFn: (row) => {
      if (row.referred_by_client_id) {
        return 'Sí';
      }
      return null;
    },
    header: 'Referido',
    cell: ({ getValue }) => {
      const isReferred = getValue() as string | null;
      if (!isReferred) {
        return <span className="text-muted-foreground text-sm">No</span>;
      }
      
      return (
        <Badge variant="secondary" className="text-xs">
          Sí
        </Badge>
      );
    },
  },
  
  {
    accessorKey: 'lead_source',
    header: 'Fuente',
    cell: ({ getValue }) => {
      const source = getValue() as LeadSource | undefined;
      return (
        <span className="text-sm">
          {getLeadSourceLabel(source)}
        </span>
      );
    },
  },
  
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const client = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditClientDialog 
              client={client}
              onClientUpdated={onClientUpdated}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Editar cliente
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 