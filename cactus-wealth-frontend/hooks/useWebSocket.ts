/**
 * 🚀 LIVE-OPS: Custom React Hook para WebSocket
 *
 * Hook personalizado que proporciona una interfaz declarativa para:
 * - Gestión automática de conexión/desconexión WebSocket
 * - Subscripción a notificaciones en tiempo real
 * - Estado de conexión reactivo
 * - Cleanup automático en unmount
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  websocketService,
  type NotificationData,
  type ConnectionStats,
} from '../services/websocket.service';

interface UseWebSocketReturn {
  // Estado de conexión
  isConnected: boolean;
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';

  // Notificaciones
  notifications: NotificationData[];
  unreadCount: number;

  // Estadísticas
  connectionStats: ConnectionStats | null;

  // Funciones
  connect: (token: string) => Promise<boolean>;
  disconnect: () => void;
  markAsRead: (notificationId: number) => void;
  clearNotifications: () => void;
  requestStats: () => void;
}

/**
 * Hook personalizado para gestionar WebSocket
 */
export function useWebSocket(): UseWebSocketReturn {
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'open' | 'closing' | 'closed'
  >('closed');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [connectionStats, setConnectionStats] =
    useState<ConnectionStats | null>(null);

  // Refs para evitar stale closures y optimizar performance
  const notificationsRef = useRef<NotificationData[]>([]);
  const connectedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar refs cuando cambien los estados
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    connectedRef.current = isConnected;
  }, [isConnected]);

  // Handlers para eventos WebSocket con debouncing
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionState('open');
  }, []);

  const handleDisconnected = useCallback((data: any) => {
    setIsConnected(false);
    setConnectionState('closed');
  }, []);

  const handleNotification = useCallback(
    (notificationData: NotificationData) => {
      // Debounce notifications to avoid excessive re-renders
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setNotifications((prev) => {
          // Evitar duplicados
          const exists = prev.some((n) => n.id === notificationData.id);
          if (exists) return prev;

          // Agregar nueva notificación al principio
          const updated = [notificationData, ...prev];

          // Mantener solo las últimas 50 notificaciones
          return updated.slice(0, 50);
        });

        // Mostrar notificación del navegador solo si es la primera
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nueva notificación - Cactus Wealth', {
            body: notificationData.message,
            icon: '/favicon.ico',
            tag: `notification-${notificationData.id}`,
          });
        }
      }, 100); // 100ms debounce
    },
    []
  );

  const handleConnectionStats = useCallback((stats: ConnectionStats) => {
    setConnectionStats(stats);
  }, []);

  const handleError = useCallback((error: any) => {
    setConnectionState('closed');
    setIsConnected(false);
  }, []);

  // Función para conectar
  const connect = useCallback(async (token: string): Promise<boolean> => {
    setConnectionState('connecting');

    try {
      const success = await websocketService.connect(token);

      if (!success) {
        setConnectionState('closed');
        setIsConnected(false);
      }

      return success;
    } catch (error) {
      console.error('🔗 Hook: Error conectando:', error);
      setConnectionState('closed');
      setIsConnected(false);
      return false;
    }
  }, []);

  // Función para desconectar
  const disconnect = useCallback(() => {
    try {
      websocketService.disconnect();
      setIsConnected(false);
      setConnectionState('closed');
    } catch (error) {
      console.error('Failed to disconnect WebSocket:', error);
    }
  }, []);

  // Función para marcar notificación como leída
  const markAsRead = useCallback((notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }, []);

  // Función para limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Función para solicitar estadísticas
  const requestStats = useCallback(() => {
    if (websocketService.isConnected()) {
      websocketService.requestConnectionStats();
    }
  }, []);

  // Efecto para registrar event listeners
  useEffect(() => {
    // Registrar listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('notification', handleNotification);
    websocketService.on('connection_stats', handleConnectionStats);
    websocketService.on('error', handleError);

    // Sincronizar estado inicial
    const currentState = websocketService.getConnectionState();
    setConnectionState(currentState);
    setIsConnected(websocketService.isConnected());

    // Cleanup function
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('notification', handleNotification);
      websocketService.off('connection_stats', handleConnectionStats);
      websocketService.off('error', handleError);

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleNotification,
    handleConnectionStats,
    handleError,
  ]);

  // Solicitar permisos de notificación del navegador al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Calcular número de notificaciones no leídas
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    // Estado
    isConnected,
    connectionState,
    notifications,
    unreadCount,
    connectionStats,

    // Funciones
    connect,
    disconnect,
    markAsRead,
    clearNotifications,
    requestStats,
  };
}

/**
 * Hook especializado solo para notificaciones (más liviano)
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const handleNotification = useCallback(
    (notificationData: NotificationData) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notificationData.id);
        if (exists) return prev;

        return [notificationData, ...prev].slice(0, 20); // Solo últimas 20
      });
    },
    []
  );

  useEffect(() => {
    websocketService.on('notification', handleNotification);

    return () => {
      websocketService.off('notification', handleNotification);
    };
  }, [handleNotification]);

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calcular número de notificaciones no leídas
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  };
}
