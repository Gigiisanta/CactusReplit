'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Client, ClientStatus } from '@/types';
import { ClientService } from '@/services/client.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, MoreHorizontal, ArrowLeft, Table } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PipelineColumn {
  id: ClientStatus;
  title: string;
  color: string;
  clients: Client[];
}

const PIPELINE_STAGES: Omit<PipelineColumn, 'clients'>[] = [
  {
    id: ClientStatus.PROSPECT,
    title: 'Prospectos',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    id: ClientStatus.CONTACTED,
    title: 'Contactados',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: ClientStatus.FIRST_MEETING,
    title: 'Primera Reunión',
    color: 'bg-indigo-50 border-indigo-200',
  },
  {
    id: ClientStatus.SECOND_MEETING,
    title: 'Segunda Reunión',
    color: 'bg-violet-50 border-violet-200',
  },
  {
    id: ClientStatus.OPENING,
    title: 'Apertura',
    color: 'bg-yellow-50 border-yellow-200',
  },
  {
    id: ClientStatus.RESCHEDULE,
    title: 'Reagendar',
    color: 'bg-orange-50 border-orange-200',
  },
  {
    id: ClientStatus.ACTIVE_INVESTOR,
    title: 'Cliente Activo',
    color: 'bg-green-50 border-green-200',
  },
  {
    id: ClientStatus.DORMANT,
    title: 'Inactivos',
    color: 'bg-gray-50 border-gray-200',
  },
];

interface PipelineBoardProps {
  clients: Client[];
  onClientUpdated?: (clientId: number, newStatus: ClientStatus) => void;
  onBackToTable?: () => void;
}

export function PipelineBoard({
  clients,
  onClientUpdated,
  onBackToTable,
}: PipelineBoardProps) {
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const safeClients = Array.isArray(clients) ? clients : [];

      // Initialize columns with empty client arrays and sort by age (oldest first)
      const initialColumns: PipelineColumn[] = PIPELINE_STAGES.map((stage) => ({
        ...stage,
        clients: safeClients
          .filter((client) => client.status === stage.id)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          ),
      }));

      setColumns(initialColumns);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clients]);

  useEffect(() => {
    loadClients();
  }, [clients, loadClients]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId
    );
    const draggedClient =
      sourceColumn?.clients && Array.isArray(sourceColumn.clients)
        ? sourceColumn.clients.find(
            (client) => client.id.toString() === draggableId
          )
        : undefined;

    if (!sourceColumn || !destColumn || !draggedClient) return;

    // Optimistic update
    const newColumns = columns.map((column) => {
      if (column.id === source.droppableId) {
        return {
          ...column,
          clients: Array.isArray(column.clients)
            ? column.clients.filter((client) => client.id !== draggedClient.id)
            : [],
        };
      }
      if (column.id === destination.droppableId) {
        const safeColumnClients = Array.isArray(column.clients)
          ? column.clients
          : [];
        const newClients = [...safeColumnClients];
        newClients.splice(destination.index, 0, {
          ...draggedClient,
          status: column.id,
        });
        // Re-sort by age after adding
        newClients.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return { ...column, clients: newClients };
      }
      return column;
    });

    setColumns(newColumns);

    // Update client status in backend
    try {
      await ClientService.updateClient(draggedClient.id, {
        status: destination.droppableId as ClientStatus,
      });
      toast.success('Cliente movido exitosamente');
      onClientUpdated?.(draggedClient.id, destination.droppableId as ClientStatus);
    } catch (error) {
      // Revert optimistic update
      setColumns(columns);
      toast.error('Error al mover cliente');
      console.error('Error updating client status:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem`;
    return `${Math.floor(diffDays / 30)} mes`;
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {/* Header with back button */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onBackToTable}
              className='gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Volver a tabla
            </Button>
            <div className='h-4 w-px bg-gray-300'></div>
            <h2 className='text-lg font-semibold'>Vista de Pipeline</h2>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className='space-y-4'>
          {PIPELINE_STAGES.map((stage) => (
            <Card key={stage.id} className={`${stage.color} border-2`}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium'>
                    {stage.title}
                  </CardTitle>
                  <div className='h-5 w-8 animate-pulse rounded bg-gray-200'></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className='h-24 animate-pulse rounded bg-gray-200'
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with back button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onBackToTable}
            className='gap-2 hover:bg-gray-100'
          >
            <Table className='h-4 w-4' />
            Vista de tabla
          </Button>
          <div className='h-4 w-px bg-gray-300'></div>
          <h2 className='text-lg font-semibold'>Vista de Pipeline</h2>
        </div>
        <div className='text-sm text-gray-500'>
          Ordenado por antigüedad • Arrastra para mover entre etapas
        </div>
      </div>

      {/* Vertical Pipeline */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='space-y-4'>
          {columns.map((column) => (
            <Card key={column.id} className={`${column.color} border-2`}>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold'>
                    {column.title}
                  </CardTitle>
                  <Badge variant='secondary' className='px-2 py-1 text-sm'>
                    {column.clients.length}
                  </Badge>
                </div>
              </CardHeader>

              <Droppable droppableId={column.id} direction='horizontal'>
                {(provided, snapshot) => (
                  <CardContent
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {!Array.isArray(column.clients) ||
                    column.clients.length === 0 ? (
                      <div className='py-8 text-center text-gray-500'>
                        <p className='text-sm'>No hay clientes en esta etapa</p>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                        {column.clients.map((client, index) => (
                          <Draggable
                            key={client.id}
                            draggableId={client.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-move bg-white transition-all hover:shadow-md ${
                                  snapshot.isDragging
                                    ? 'rotate-2 scale-105 shadow-xl'
                                    : ''
                                }`}
                              >
                                <CardContent className='p-4'>
                                  <div className='mb-3 flex items-start justify-between'>
                                    <div className='flex items-center space-x-3'>
                                      <Avatar className='h-10 w-10'>
                                        <AvatarFallback className='text-sm font-medium'>
                                          {getInitials(
                                            client.first_name,
                                            client.last_name
                                          )}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-semibold'>
                                          {client.first_name} {client.last_name}
                                        </p>
                                        <p className='truncate text-xs text-gray-500'>
                                          {client.email}
                                        </p>
                                      </div>
                                    </div>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          className='h-6 w-6 p-0'
                                        >
                                          <MoreHorizontal className='h-4 w-4' />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align='end'>
                                        <DropdownMenuItem>
                                          <Phone className='mr-2 h-4 w-4' />
                                          Llamar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Mail className='mr-2 h-4 w-4' />
                                          Enviar email
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {client.notes && (
                                    <p className='mb-3 line-clamp-2 text-xs text-gray-600'>
                                      {client.notes}
                                    </p>
                                  )}

                                  <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <Badge
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        {client.risk_profile}
                                      </Badge>
                                      <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-500'>
                                        {formatDaysAgo(client.created_at)}
                                      </span>
                                    </div>
                                    {client.lead_source && (
                                      <span className='text-xs text-gray-500'>
                                        {client.lead_source === 'referral'
                                          ? 'Referido'
                                          : client.lead_source ===
                                              'social_media'
                                            ? 'Redes'
                                            : client.lead_source === 'event'
                                              ? 'Evento'
                                              : client.lead_source === 'organic'
                                                ? 'Orgánico'
                                                : client.lead_source}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    )}
                    {provided.placeholder}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
