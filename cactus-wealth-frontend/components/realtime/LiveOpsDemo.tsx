/**
 * 🚀 LIVE-OPS DEMO: Componente de demostración completa
 *
 * Demuestra todas las capacidades de Live-Ops:
 * - Conexión WebSocket en tiempo real
 * - Notificaciones push automáticas
 * - Estado de conexión reactivo
 * - Creación manual de notificaciones
 * - Estadísticas de conexión
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Bell,
  Send,
  Activity,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLiveOpsDemo } from '@/hooks/useLiveOpsDemo';

export function LiveOpsDemo() {
  const {
    isConnected,
    connectionState,
    notifications,
    unreadCount,
    connectionStats,
    connect,
    disconnect,
    requestStats,
    markAsRead,
    clearNotifications,
    customMessage,
    setCustomMessage,
    isCreatingNotification,
    setIsCreatingNotification,
    demoLogs,
    addLog,
    handleToggleConnection,
    setDemoLogs,
  } = useLiveOpsDemo();

  const { token } = useAuth();

  // Efecto para logs de conexión
  useEffect(() => {
    if (isConnected) {
      addLog('🔗 WebSocket conectado');
    }
  }, [isConnected, addLog]);

  useEffect(() => {
    if (connectionState === 'closed') {
      addLog('❌ WebSocket desconectado');
    }
  }, [connectionState, addLog]);

  // Efecto para logs de notificaciones
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      addLog(`🔔 Nueva notificación: ${latest.message.substring(0, 50)}...`);
    }
  }, [notifications, addLog]);

  // Crear notificación personalizada
  const handleCreateNotification = async () => {
    if (!customMessage.trim()) return;

    setIsCreatingNotification(true);
    addLog(`📤 Enviando notificación: ${customMessage}`);

    try {
      await apiClient.createNotification({
        message: customMessage,
      });

      setCustomMessage('');
      addLog('✅ Notificación enviada exitosamente');
    } catch (error) {
      console.error('Error creating notification:', error);
      addLog('❌ Error enviando notificación');
    } finally {
      setIsCreatingNotification(false);
    }
  };

  // Solicitar estadísticas
  const handleRequestStats = () => {
    addLog('📊 Solicitando estadísticas de conexión...');
    requestStats();
  };

  // Función para obtener estado visual de conexión
  const getConnectionStatusIcon = () => {
    switch (connectionState) {
      case 'open':
        return <CheckCircle className='text-green-500' size={20} />;
      case 'connecting':
        return <Activity className='animate-spin text-yellow-500' size={20} />;
      case 'closing':
        return <AlertTriangle className='text-orange-500' size={20} />;
      case 'closed':
        return <XCircle className='text-red-500' size={20} />;
      default:
        return <XCircle className='text-gray-500' size={20} />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'closing':
        return 'Desconectando...';
      case 'closed':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className='mx-auto max-w-4xl space-y-6 p-6'>
      {/* Header */}
      <div className='text-center'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>
          🚀 Live-Ops Demo
        </h1>
        <p className='text-gray-600'>
          Demostración completa de notificaciones en tiempo real
        </p>
      </div>

      {/* Estado de Conexión */}
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='flex items-center text-xl font-semibold'>
            {isConnected ? (
              <Wifi className='mr-2 text-green-500' />
            ) : (
              <WifiOff className='mr-2 text-red-500' />
            )}
            Estado de Conexión
          </h2>
          <Button
            variant={isConnected ? 'destructive' : 'default'}
            onClick={() => handleToggleConnection(token || undefined)}
            className='min-w-[120px]'
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-3'>
            {getConnectionStatusIcon()}
            <div>
              <p className='font-medium'>Estado</p>
              <p className='text-sm text-gray-600'>
                {getConnectionStatusText()}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-3'>
            <Bell className='text-blue-500' size={20} />
            <div>
              <p className='font-medium'>Notificaciones</p>
              <p className='text-sm text-gray-600'>
                {unreadCount} no leídas / {notifications.length} total
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-3'>
            <Users className='text-purple-500' size={20} />
            <div>
              <p className='font-medium'>Conexiones</p>
              <p className='text-sm text-gray-600'>
                {connectionStats?.total_connections || 0} activas
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Crear Notificación */}
      <Card className='p-6'>
        <h2 className='mb-4 flex items-center text-xl font-semibold'>
          <Send className='mr-2 text-blue-500' />
          Crear Notificación de Prueba
        </h2>

        <div className='flex space-x-2'>
          <Input
            placeholder='Escribe un mensaje de notificación...'
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateNotification()}
            disabled={isCreatingNotification}
          />
          <Button
            onClick={handleCreateNotification}
            disabled={!customMessage.trim() || isCreatingNotification}
            className='min-w-[100px]'
          >
            {isCreatingNotification ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCustomMessage(
                '🎉 ¡Portfolio actualizado con nuevas posiciones!'
              )
            }
          >
            Portfolio Update
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCustomMessage('📊 Reporte generado exitosamente')}
          >
            Report Generated
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCustomMessage(
                '🚨 Alerta: Movimiento significativo en el mercado'
              )
            }
          >
            Market Alert
          </Button>
        </div>
      </Card>

      {/* Estadísticas */}
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='flex items-center text-xl font-semibold'>
            <Activity className='mr-2 text-green-500' />
            Estadísticas de Conexión
          </h2>
          <Button variant='outline' onClick={handleRequestStats}>
            Actualizar
          </Button>
        </div>

        {connectionStats ? (
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='rounded-lg bg-blue-50 p-3 text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                {connectionStats.total_connections}
              </p>
              <p className='text-sm text-gray-600'>Conexiones Totales</p>
            </div>
            <div className='rounded-lg bg-green-50 p-3 text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {connectionStats.active_users}
              </p>
              <p className='text-sm text-gray-600'>Usuarios Activos</p>
            </div>
            <div className='rounded-lg bg-purple-50 p-3 text-center'>
              <p className='text-2xl font-bold text-purple-600'>
                {connectionStats.average_connections_per_user.toFixed(1)}
              </p>
              <p className='text-sm text-gray-600'>Promedio por Usuario</p>
            </div>
            <div className='rounded-lg bg-orange-50 p-3 text-center'>
              <p className='text-2xl font-bold text-orange-600'>
                {Object.keys(connectionStats.user_connection_counts).length}
              </p>
              <p className='text-sm text-gray-600'>Usuarios Únicos</p>
            </div>
          </div>
        ) : (
          <p className='py-4 text-center text-gray-500'>
            No hay estadísticas disponibles. Haz click en &quot;Actualizar&quot;
            para solicitar datos.
          </p>
        )}
      </Card>

      {/* Logs de Actividad */}
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='flex items-center text-xl font-semibold'>
            <Zap className='mr-2 text-yellow-500' />
            Logs de Actividad
          </h2>
          <Button variant='outline' size='sm' onClick={() => setDemoLogs([])}>
            Limpiar
          </Button>
        </div>

        <div className='max-h-48 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-green-400'>
          {demoLogs.length === 0 ? (
            <p className='text-gray-500'>No hay logs disponibles...</p>
          ) : (
            demoLogs.map((log, index) => (
              <div key={index} className='mb-1'>
                {log}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Lista de Notificaciones */}
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='flex items-center text-xl font-semibold'>
            <Bell className='mr-2 text-blue-500' />
            Notificaciones Recibidas
          </h2>
          <div className='flex space-x-2'>
            <Badge variant='secondary'>{unreadCount} no leídas</Badge>
            <Button
              variant='outline'
              size='sm'
              onClick={clearNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className='py-8 text-center text-gray-500'>
            <Bell size={48} className='mx-auto mb-4 text-gray-300' />
            <p>No hay notificaciones</p>
            <p className='text-sm'>Crea una notificación de prueba arriba</p>
          </div>
        ) : (
          <div className='max-h-64 space-y-2 overflow-y-auto'>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`
                  cursor-pointer rounded-lg p-3 transition-all
                  ${
                    notification.is_read
                      ? 'border border-gray-200 bg-gray-50 text-gray-600'
                      : 'border border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                  }
                `}
              >
                <div className='flex items-start justify-between'>
                  <p
                    className={
                      notification.is_read ? 'font-normal' : 'font-medium'
                    }
                  >
                    {notification.message}
                  </p>
                  {!notification.is_read && (
                    <Badge variant='default' className='ml-2 text-xs'>
                      Nueva
                    </Badge>
                  )}
                </div>
                <p className='mt-1 text-xs text-gray-500'>
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
