/**
 * 🚀 LIVE-OPS: WebSocket Service para notificaciones en tiempo real
 *
 * Gestiona la conexión WebSocket con el backend para:
 * - Notificaciones push en tiempo real
 * - Actualizaciones de KPIs automáticas
 * - Comunicación bidireccional
 * - Reconnexión automática
 */

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  target_user_id?: number;
  broadcast?: boolean;
}

interface NotificationData {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ConnectionStats {
  total_connections: number;
  active_users: number;
  user_connection_counts: { [key: string]: number };
  average_connections_per_user: number;
}

type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Empezar con 1 segundo
  private isConnecting = false;
  private token: string | null = null;
  private listeners: Map<string, WebSocketEventCallback[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionEstablished = false;

  // URLs del WebSocket
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // En Docker, necesitamos conectar al backend a través del proxy del frontend
    // El frontend actúa como proxy para las conexiones WebSocket
    const host = window.location.host;

    return `${protocol}//${host}/api/v1/ws/notifications`;
  }

  /**
   * Establece conexión WebSocket con el backend
   */
  async connect(authToken: string): Promise<boolean> {
    if (this.isConnecting || this.websocket?.readyState === WebSocket.OPEN) {
      // WebSocket: Already connected or connecting
      return true;
    }

    this.token = authToken;
    this.isConnecting = true;

    try {
      const wsUrl = `${this.getWebSocketUrl()}?token=${authToken}`;
      // WebSocket: Connecting to ${wsUrl}

      this.websocket = new WebSocket(wsUrl);

      // Configurar event listeners
      this.websocket.onopen = this.handleOpen.bind(this);
      this.websocket.onmessage = this.handleMessage.bind(this);
      this.websocket.onclose = this.handleClose.bind(this);
      this.websocket.onerror = this.handleError.bind(this);

      return new Promise((resolve) => {
        // Resolver cuando la conexión se establezca o falle
        const checkConnection = () => {
          if (this.connectionEstablished) {
            resolve(true);
          } else if (this.websocket?.readyState === WebSocket.CLOSED) {
            resolve(false);
          } else {
            // Seguir esperando
            setTimeout(checkConnection, 100);
          }
        };

        // Timeout de 10 segundos
        setTimeout(() => {
          if (!this.connectionEstablished) {
            console.error('🔗 WebSocket: Timeout de conexión');
            resolve(false);
          }
        }, 10000);

        checkConnection();
      });
    } catch (error) {
      console.error('🔗 WebSocket: Error en connect:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Desconecta el WebSocket
   */
  disconnect(): void {
    if (!this.websocket) return;

    // WebSocket: Disconnecting...
    this.reconnectAttempts = 0;
    this.isConnecting = false;

    // Limpiar ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Cerrar conexión
    this.websocket.close(1000, 'Desconexión manual');
    this.websocket = null;
    this.connectionEstablished = false;
  }

  /**
   * Registra un listener para un tipo de mensaje específico
   */
  on(eventType: string, callback: WebSocketEventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(callback);
    // WebSocket: Listener registered for '${eventType}'
  }

  /**
   * Remueve un listener
   */
  off(eventType: string, callback: WebSocketEventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        // WebSocket: Listener removed for '${eventType}'
      }
    }
  }

  /**
   * Envía un mensaje al servidor
   */
  send(message: WebSocketMessage): boolean {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      // WebSocket: Message sent: ${message.type}
      return true;
    } else {
      console.error('🔗 WebSocket: No se puede enviar, conexión no disponible');
      return false;
    }
  }

  /**
   * Solicita estadísticas de conexión
   */
  requestConnectionStats(): void {
    this.send({ type: 'request_connection_stats' });
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.websocket) return 'closed';

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return (
      this.connectionEstablished &&
      this.websocket?.readyState === WebSocket.OPEN
    );
  }

  // Event Handlers Internos

  private handleOpen(event: Event): void {
    // WebSocket: Connection established
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Iniciar ping interval para keep-alive
    this.startPingInterval();

    // Emitir evento de conexión
    this.emit('connected', { timestamp: new Date().toISOString() });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      // WebSocket: Message received: ${message.type}

      // Manejar tipos especiales de mensajes
      switch (message.type) {
        case 'connection_established':
          this.connectionEstablished = true;
          // WebSocket: Connection confirmed by server
          break;

        case 'pong':
          // Respuesta a ping - mantener conexión viva
          break;

        case 'notification':
          // WebSocket: New notification received
          this.emit('notification', message.data);
          break;

        case 'kpi_update':
          // WebSocket: KPI update
          this.emit('kpi_update', message.data);
          break;

        case 'connection_stats':
          // WebSocket: Connection statistics
          this.emit('connection_stats', message.data);
          break;

        case 'error':
          console.error('❌ WebSocket: Error del servidor:', message);
          this.emit('error', message);
          break;

        default:
          // Emitir evento genérico
          this.emit(message.type, message.data);
      }
    } catch (error) {
      console.error('🔗 WebSocket: Error parseando mensaje:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    // WebSocket: Connection closed ${event.code} ${event.reason}

    this.connectionEstablished = false;
    this.isConnecting = false;

    // Limpiar ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Emitir evento de desconexión
    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      timestamp: new Date().toISOString(),
    });

    // Intentar reconexión automática si no fue manual
    if (event.code !== 1000 && this.token) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('🔗 WebSocket: Error de conexión:', event);
    this.emit('error', {
      message: 'Error de conexión WebSocket',
      timestamp: new Date().toISOString(),
    });
  }

  private startPingInterval(): void {
    // Enviar ping cada 30 segundos para mantener conexión viva
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        timestamp: new Date().toISOString(),
      });
    }, 30000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔗 WebSocket: Máximo de intentos de reconexión alcanzado');
      this.emit('max_reconnects_reached', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    // WebSocket: Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private emit(eventType: string, data: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `🔗 WebSocket: Error en callback para '${eventType}':`,
            error
          );
        }
      });
    }
  }
}

// Instancia singleton del servicio WebSocket
export const websocketService = new WebSocketService();

// Types para export
export type {
  WebSocketMessage,
  NotificationData,
  ConnectionStats,
  WebSocketEventCallback,
};
