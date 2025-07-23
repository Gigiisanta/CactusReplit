/**
 * 🚀 LIVE-OPS: Componente de Notificaciones en Tiempo Real
 *
 * Icono de campana con badge que muestra notificaciones en tiempo real:
 * - Badge con contador de notificaciones no leídas
 * - Dropdown con lista de notificaciones
 * - Marcado automático como leídas
 * - Integración completa con WebSocket
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../../hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface LiveNotificationsProps {
  isConnected?: boolean;
  className?: string;
}

export function LiveNotifications({
  isConnected = false,
  className = '',
}: LiveNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, clearAll } =
    useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = (notificationId: number) => {
    markAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearAll();
    setIsOpen(false);
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Hace un momento';
    }
  };

  const getConnectionIndicator = () => {
    if (isConnected) {
      return (
        <div className='mb-2 flex items-center rounded bg-green-50 px-3 py-1 text-xs text-green-600'>
          <Wifi size={12} className='mr-1' />
          Conectado en tiempo real
        </div>
      );
    } else {
      return (
        <div className='mb-2 flex items-center rounded bg-orange-50 px-3 py-1 text-xs text-orange-600'>
          <WifiOff size={12} className='mr-1' />
          Desconectado
        </div>
      );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative rounded-lg p-2 transition-colors duration-200
          ${
            isOpen
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }
          ${!isConnected ? 'opacity-60' : ''}
        `}
        title={`${unreadCount} notificaciones no leídas`}
      >
        <Bell size={20} />

        {/* Badge con contador */}
        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs text-white'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Indicador de conexión */}
        <div
          className={`
          absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white
          ${isConnected ? 'bg-green-400' : 'bg-orange-400'}
        `}
        />
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className='absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg'
        >
          {/* Header */}
          <div className='border-b border-gray-200 bg-gray-50 px-4 py-3'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-gray-900'>Notificaciones</h3>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 transition-colors hover:text-gray-600'
              >
                <X size={16} />
              </button>
            </div>

            {/* Indicador de conexión */}
            {getConnectionIndicator()}
          </div>

          {/* Lista de notificaciones */}
          <div className='max-h-64 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='px-4 py-8 text-center text-gray-500'>
                <Bell size={32} className='mx-auto mb-2 text-gray-300' />
                <p>No hay notificaciones</p>
                <p className='text-sm'>Te avisaremos cuando haya novedades</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`
                    cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors
                    ${
                      notification.is_read
                        ? 'bg-white text-gray-600 hover:bg-gray-50'
                        : 'border-l-4 border-l-blue-500 bg-blue-50 text-gray-900 hover:bg-blue-100'
                    }
                  `}
                >
                  <p
                    className={`text-sm ${notification.is_read ? 'font-normal' : 'font-medium'}`}
                  >
                    {notification.message}
                  </p>
                  <p className='mt-1 text-xs text-gray-500'>
                    {formatNotificationTime(notification.created_at)}
                  </p>

                  {/* Badge "Nueva" para notificaciones no leídas */}
                  {!notification.is_read && (
                    <span className='mt-1 inline-block rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white'>
                      Nueva
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='border-t border-gray-200 bg-gray-50 px-4 py-3'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-500'>
                  {unreadCount} no leídas de {notifications.length} total
                </span>
                <button
                  onClick={handleClearAll}
                  className='text-xs font-medium text-blue-600 transition-colors hover:text-blue-800'
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 🚀 Componente Badge Simple (para uso en otros lugares)
 */
interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
  count,
  className = '',
  size = 'md',
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm',
  };

  return (
    <span
      className={`
      inline-flex items-center justify-center
      rounded-full bg-red-500 font-medium text-white
      ${sizeClasses[size]}
      ${className}
    `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * 🚀 Toast de Notificación (para notificaciones emergentes)
 */
interface NotificationToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function NotificationToast({
  message,
  onClose,
  duration = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className='animate-slide-in-right fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg'>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>
          <Bell className='text-blue-500' size={20} />
        </div>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-900'>
            Nueva notificación
          </p>
          <p className='mt-1 text-sm text-gray-600'>{message}</p>
        </div>
        <button
          onClick={onClose}
          className='flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600'
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
