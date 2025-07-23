import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  apiClientInterceptor: {
    getClient: jest.fn(() => ({
      post: jest.fn(),
      get: jest.fn(),
    })),
  },
}));

// Mock the auth store
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    token: 'test-token',
    logout: jest.fn(),
    isAuthenticated: false,
    user: null,
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isLoading } = useAuth();

  return (
    <div>
      <div data-testid='user'>{user ? user.email : 'No user'}</div>
      <div data-testid='loading'>{isLoading ? 'Loading' : 'Not loading'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
  });

  it('renders without crashing', () => {
    expect(() => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    }).not.toThrow();
  });
});
