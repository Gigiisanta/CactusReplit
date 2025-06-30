import { useAuthStore } from '@/stores/auth.store';
import { UserRole, User } from '@/types';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock localStorage properly for Jest
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should login user successfully', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      role: UserRole.JUNIOR_ADVISOR,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: [],
    };
    const mockToken = 'test-token-123';

    const { login } = useAuthStore.getState();
    login(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should logout user successfully', () => {
    // First login
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      role: UserRole.JUNIOR_ADVISOR,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: [],
    };
    const { login, logout } = useAuthStore.getState();
    login(mockUser, 'test-token');

    // Then logout
    logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user data correctly', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      role: UserRole.JUNIOR_ADVISOR,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: [],
    };

    const { setUser } = useAuthStore.getState();
    setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });
});

describe('Auth Store Persistence', () => {
  it('should handle rehydration correctly when token exists', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_active: true,
      role: UserRole.JUNIOR_ADVISOR,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clients: [],
    };

    // Simulate rehydration with persisted data
    const rehydratedState = {
      user: mockUser,
      token: 'existing-token',
    };

    // Mock onRehydrateStorage callback
    const mockState = { ...rehydratedState, isAuthenticated: false };
    const onRehydrateStorage = useAuthStore.persist.getOptions().onRehydrateStorage;
    const callback = onRehydrateStorage?.();
    callback?.(mockState as any);

    expect(mockState.isAuthenticated).toBe(true);
  });

  it('should handle rehydration correctly when no token exists', () => {
    const rehydratedState = {
      user: null,
      token: null,
    };

    // Mock onRehydrateStorage callback
    const mockState = { ...rehydratedState, isAuthenticated: false };
    const onRehydrateStorage = useAuthStore.persist.getOptions().onRehydrateStorage;
    const callback = onRehydrateStorage?.();
    callback?.(mockState as any);

    expect(mockState.isAuthenticated).toBe(false);
  });
}); 