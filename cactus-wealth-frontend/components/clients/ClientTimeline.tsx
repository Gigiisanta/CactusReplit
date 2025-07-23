'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClientActivity, ActivityType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  User,
  FileText,
  Calendar,
  CheckCircle,
  Mail,
  Phone,
  Upload,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientTimelineProps {
  clientId: number;
  onAddActivity?: (activity: ClientActivity) => void;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case ActivityType.STATUS_CHANGE:
      return <TrendingUp className='h-4 w-4' />;
    case ActivityType.NOTE_ADDED:
      return <FileText className='h-4 w-4' />;
    case ActivityType.MEETING_SCHEDULED:
      return <Calendar className='h-4 w-4' />;
    case ActivityType.MEETING_COMPLETED:
      return <CheckCircle className='h-4 w-4' />;
    case ActivityType.PROPOSAL_SENT:
      return <Mail className='h-4 w-4' />;
    case ActivityType.DOCUMENT_UPLOADED:
      return <Upload className='h-4 w-4' />;
    case ActivityType.CALL_MADE:
      return <Phone className='h-4 w-4' />;
    case ActivityType.EMAIL_SENT:
      return <Mail className='h-4 w-4' />;
    default:
      return <Clock className='h-4 w-4' />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case ActivityType.STATUS_CHANGE:
      return 'bg-blue-100 text-blue-700';
    case ActivityType.NOTE_ADDED:
      return 'bg-gray-100 text-gray-700';
    case ActivityType.MEETING_SCHEDULED:
      return 'bg-purple-100 text-purple-700';
    case ActivityType.MEETING_COMPLETED:
      return 'bg-green-100 text-green-700';
    case ActivityType.PROPOSAL_SENT:
      return 'bg-orange-100 text-orange-700';
    case ActivityType.DOCUMENT_UPLOADED:
      return 'bg-indigo-100 text-indigo-700';
    case ActivityType.CALL_MADE:
      return 'bg-emerald-100 text-emerald-700';
    case ActivityType.EMAIL_SENT:
      return 'bg-cyan-100 text-cyan-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getActivityLabel = (type: ActivityType) => {
  switch (type) {
    case ActivityType.STATUS_CHANGE:
      return 'Cambio de estado';
    case ActivityType.NOTE_ADDED:
      return 'Nota agregada';
    case ActivityType.MEETING_SCHEDULED:
      return 'Reunión agendada';
    case ActivityType.MEETING_COMPLETED:
      return 'Reunión completada';
    case ActivityType.PROPOSAL_SENT:
      return 'Propuesta enviada';
    case ActivityType.DOCUMENT_UPLOADED:
      return 'Documento subido';
    case ActivityType.CALL_MADE:
      return 'Llamada realizada';
    case ActivityType.EMAIL_SENT:
      return 'Email enviado';
    default:
      return 'Actividad';
  }
};

export function ClientTimeline({
  clientId,
  onAddActivity,
}: ClientTimelineProps) {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement actual API call to fetch client activities
      // const activities = await ClientService.getClientActivities(clientId);
      // setActivities(activities);

      // Mock data for now
      const mockActivities: ClientActivity[] = [
        {
          id: 1,
          client_id: clientId,
          activity_type: ActivityType.STATUS_CHANGE,
          description: 'Estado cambiado de "Prospecto" a "Contactado"',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          created_by: 1,
        },
        {
          id: 2,
          client_id: clientId,
          activity_type: ActivityType.NOTE_ADDED,
          description:
            'Cliente interesado en portfolio conservador, prefiere bonos y ETFs de bajo riesgo.',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          created_by: 1,
        },
        {
          id: 3,
          client_id: clientId,
          activity_type: ActivityType.MEETING_SCHEDULED,
          description:
            'Primera reunión agendada para el 25 de diciembre a las 10:00 AM',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          created_by: 1,
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setError('Error al cargar las actividades');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Timeline de Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex space-x-4'>
                <div className='h-8 w-8 animate-pulse rounded-full bg-gray-200'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-3/4 animate-pulse rounded bg-gray-200'></div>
                  <div className='h-3 w-1/2 animate-pulse rounded bg-gray-200'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Timeline de Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>{error}</p>
            <Button variant='outline' onClick={loadActivities} className='mt-4'>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Timeline de Actividades
          </CardTitle>
          <Button size='sm' variant='outline'>
            <Plus className='mr-2 h-4 w-4' />
            Agregar Actividad
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className='py-8 text-center'>
            <Clock className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <p className='text-muted-foreground'>
              No hay actividades registradas
            </p>
            <Button size='sm' variant='outline' className='mt-4'>
              <Plus className='mr-2 h-4 w-4' />
              Agregar primera actividad
            </Button>
          </div>
        ) : (
          <ScrollArea className='h-96'>
            <div className='space-y-4'>
              {activities.map((activity, index) => (
                <div key={activity.id} className='flex space-x-4'>
                  <div className='relative'>
                    <div
                      className={`rounded-full p-2 ${getActivityColor(activity.activity_type)}`}
                    >
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    {index < activities.length - 1 && (
                      <div className='absolute left-1/2 top-10 h-8 w-0.5 -translate-x-1/2 transform bg-gray-200'></div>
                    )}
                  </div>

                  <div className='min-w-0 flex-1 pb-8'>
                    <div className='flex items-center justify-between'>
                      <Badge variant='secondary' className='text-xs'>
                        {getActivityLabel(activity.activity_type)}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    <p className='mt-1 text-sm text-gray-900'>
                      {activity.description}
                    </p>

                    {activity.extra_data && (
                      <div className='mt-2 text-xs text-muted-foreground'>
                        <details>
                          <summary className='cursor-pointer hover:text-gray-900'>
                            Ver detalles
                          </summary>
                          <pre className='mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs'>
                            {JSON.stringify(
                              JSON.parse(activity.extra_data),
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
