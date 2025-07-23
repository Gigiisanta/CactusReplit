import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveOpsDemo } from './LiveOpsDemo';

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: false,
    connectionState: 'closed',
    notifications: [],
    unreadCount: 0,
    connectionStats: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    requestStats: jest.fn(),
    markAsRead: jest.fn(),
    clearNotifications: jest.fn(),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    createNotification: jest.fn(() => Promise.resolve()),
  },
}));

class MockWebSocket {
  constructor() {}
  close = jest.fn();
  send = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
}
global.WebSocket = MockWebSocket as any;

describe('LiveOpsDemo', () => {
  it('renders header and connection state', () => {
    render(<LiveOpsDemo />);
    expect(screen.getByText(/Live-Ops Demo/i)).toBeInTheDocument();
    expect(screen.getByText(/Estado de Conexión/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Desconectado/i).length).toBeGreaterThan(0);
  });

  it('renders notification input and buttons', () => {
    render(<LiveOpsDemo />);
    expect(
      screen.getByPlaceholderText(/Escribe un mensaje/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Portfolio Update/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Report Generated/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Market Alert/i })
    ).toBeInTheDocument();
  });

  it('renders statistics and logs sections', () => {
    render(<LiveOpsDemo />);
    expect(screen.getByText(/Estadísticas de Conexión/i)).toBeInTheDocument();
    expect(screen.getByText(/Logs de Actividad/i)).toBeInTheDocument();
    expect(screen.getByText(/Notificaciones Recibidas/i)).toBeInTheDocument();
  });

  it('allows typing and sending a notification', async () => {
    render(<LiveOpsDemo />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje/i);
    fireEvent.change(input, { target: { value: 'Test notification' } });
    expect(input).toHaveValue('Test notification');
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('clears logs when Clear button is clicked', () => {
    render(<LiveOpsDemo />);
    const clearBtn = screen.getAllByRole('button', { name: /Limpiar/i })[0];
    fireEvent.click(clearBtn);
    expect(screen.getByText(/No hay logs disponibles/i)).toBeInTheDocument();
  });

  it('clears notifications when Clear All is clicked', () => {
    render(<LiveOpsDemo />);
    const clearAllBtn = screen.getAllByRole('button', {
      name: /Clear All/i,
    })[0];
    fireEvent.click(clearAllBtn);
    expect(screen.getByText(/No hay notificaciones/i)).toBeInTheDocument();
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});
