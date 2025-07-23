import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

export function useLiveOpsDemo() {
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
  } = useWebSocket();

  const [customMessage, setCustomMessage] = useState('');
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDemoLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  }, []);

  const handleToggleConnection = useCallback(
    async (token?: string) => {
      if (isConnected) {
        addLog('🔄 Desconectando WebSocket...');
        disconnect();
      } else {
        if (token) {
          addLog('🔄 Conectando WebSocket...');
          const success = await connect(token);
          if (!success) {
            addLog('❌ Error al conectar WebSocket');
          }
        } else {
          addLog('❌ No hay token disponible');
        }
      }
    },
    [isConnected, connect, disconnect, addLog]
  );

  return {
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
  };
}
