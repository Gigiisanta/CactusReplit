import { websocketService } from '@/services/websocket.service';

describe('WebSocketService', () => {
  beforeEach(() => {
    // Reset the singleton instance
    (websocketService as any).websocket = null;
    (websocketService as any).isConnecting = false;
    (websocketService as any).connectionEstablished = false;
    (websocketService as any).reconnectAttempts = 0;
  });

  afterEach(() => {
    websocketService.disconnect();
  });

  describe('disconnect', () => {
    it('should not throw error if not connected', () => {
      expect(() => websocketService.disconnect()).not.toThrow();
    });
  });

  describe('send', () => {
    it('should not send message if not connected', () => {
      const message = { type: 'test', data: 'test data' };

      const result = websocketService.send(message);

      expect(result).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should add and remove event listeners without throwing', () => {
      const handler = jest.fn();

      expect(() => websocketService.on('test-event', handler)).not.toThrow();
      expect(() => websocketService.off('test-event', handler)).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(websocketService.isConnected()).toBe(false);
    });
  });

  describe('getConnectionState', () => {
    it('should return closed when not connected', () => {
      expect(websocketService.getConnectionState()).toBe('closed');
    });
  });

  describe('requestConnectionStats', () => {
    it('should not throw when called', () => {
      expect(() => websocketService.requestConnectionStats()).not.toThrow();
    });
  });
});
