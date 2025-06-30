'use client';

import { Client, ClientStatus, LeadSource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClientDetailsCardProps {
  client: Client;
}

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

export function ClientDetailsCard({ client }: ClientDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Estado</label>
          <div className="mt-1">
            <Badge className={getStatusColor(client.status)}>
              {getStatusLabel(client.status)}
            </Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Perfil de Riesgo</label>
          <p className="mt-1 text-sm">{client.risk_profile}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Fuente</label>
          <p className="mt-1 text-sm">{getLeadSourceLabel(client.lead_source)}</p>
        </div>

        {client.referred_by_client_id && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Referido por</label>
            <Badge variant="secondary" className="mt-1">
              Cliente ID: {client.referred_by_client_id}
            </Badge>
          </div>
        )}

        {client.notes && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Notas</label>
            <p className="mt-1 text-sm bg-muted p-3 rounded-md">{client.notes}</p>
          </div>
        )}

        <div className="pt-2 border-t">
          <label className="text-sm font-medium text-muted-foreground">Fechas</label>
          <div className="mt-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Creado: {new Date(client.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Actualizado: {new Date(client.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 