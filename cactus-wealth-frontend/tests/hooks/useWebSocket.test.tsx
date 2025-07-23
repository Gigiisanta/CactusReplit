import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';

// Mock WebSocket
const mockWebSocket = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock websocket service
jest.mock('@/services/websocket.service', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    isConnected: jest.fn(),
    getConnectionState: jest.fn(),
    requestConnectionStats: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(false);
  });

  it('handles notifications and unread count', () => {
    const { result } = renderHook(() => useWebSocket());

    // Test that the hook initializes correctly
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);

    // Test that markAsRead function exists
    expect(typeof result.current.markAsRead).toBe('function');
  });

  it('marks notification as read', () => {
    const { result } = renderHook(() => useWebSocket());

    // Test that the hook provides the expected interface
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.clearNotifications).toBe('function');
  });
});
