'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api';
import { UserRole, User } from '@/types';
import { isTokenExpired, getTokenTimeRemaining } from '@/lib/token-utils';

export function AuthProvider({
  children,
  apiClient: injectedApiClient,
}: {
  children: React.ReactNode;
  apiClient?: typeof apiClient;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const {
    login: zustandLogin,
    logout: zustandLogout,
    isAuthenticated,
    token,
  } = useAuthStore();
  const router = useRouter();

  const api = injectedApiClient || apiClient;

  // Auto token validation and cleanup
  useEffect(() => {
    const startTokenMonitoring = () => {
      // Clear any existing interval
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }

      // Check token every 30 seconds
      tokenCheckInterval.current = setInterval(() => {
        const currentToken = useAuthStore.getState().token;

        if (currentToken) {
          if (isTokenExpired(currentToken, 3)) {
            // 3 minute buffer
            console.warn(
              '🔒 Token expired during monitoring, performing automatic logout'
            );
            handleAutoLogout();
          } else {
            const remaining = getTokenTimeRemaining(currentToken);
            if (remaining <= 5) {
              console.warn(`🔒 Token expires in ${remaining} minutes`);
            }
          }
        }
      }, 30000); // Check every 30 seconds
    };

    const stopTokenMonitoring = () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
        tokenCheckInterval.current = null;
      }
    };

    if (isAuthenticated && token) {
      // Immediately check current token
      if (isTokenExpired(token, 1)) {
        console.warn(
          '🔒 Found expired token on initialization, performing cleanup'
        );
        handleAutoLogout();
        return;
      }

      startTokenMonitoring();
    } else {
      stopTokenMonitoring();
    }

    return () => stopTokenMonitoring();
  }, [isAuthenticated, token]);

  const handleAutoLogout = () => {
    console.log('🔒 Performing automatic logout due to token expiry');

    // Stop monitoring
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }

    // Clear auth state
    zustandLogout();

    // Clear localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cactus-auth-storage');

      // Navigate to login
      router.push('/login');
    }
  };

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = () => {
      try {
        // Check if there's a stored auth state
        const storedAuth = localStorage.getItem('cactus-auth-storage');
        if (storedAuth) {
          const { state } = JSON.parse(storedAuth);
          if (state.token && state.user) {
            // Check if stored token is expired
            if (isTokenExpired(state.token, 1)) {
              console.warn('🔒 Stored token is expired, clearing auth state');
              localStorage.removeItem('cactus-auth-storage');
              zustandLogout();
            } else {
              // Auth state exists and token is valid
              setIsInitialized(true);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error reading auth state:', error);
        // Clear corrupted state
        localStorage.removeItem('cactus-auth-storage');
        zustandLogout();
      }

      // No valid auth state found
      setIsInitialized(true);
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for storage changes (logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cactus-auth-storage' && e.newValue === null) {
        console.log('🔒 Logout detected in another tab');
        zustandLogout();
        router.push('/login');
      }
    };

    // Listen for auth logout events from API interceptor
    const handleAuthLogout = () => {
      console.log('🔒 Logout event received from API interceptor');
      router.push('/login');
    };

    // Listen for page visibility changes to check token
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentToken = useAuthStore.getState().token;
        if (currentToken && isTokenExpired(currentToken, 1)) {
          console.warn(
            '🔒 Token expired while tab was hidden, performing logout'
          );
          handleAutoLogout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleAuthLogout);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear interval on cleanup
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, [zustandLogout, router]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const tokenResponse = await api.login({ username, password });

      const { access_token } = tokenResponse;

      // Validate new token before storing
      if (isTokenExpired(access_token, 0)) {
        throw new Error('Received expired token from server');
      }

      const mockUser: User = {
        id: 1,
        username: username,
        email: 'demo@cactuswealth.com',
        is_active: true,
        role: UserRole.JUNIOR_ADVISOR,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clients: [],
      };

      zustandLogin(mockUser, access_token);

      console.log(
        `✅ Login successful, token expires in ${getTokenTimeRemaining(access_token)} minutes`
      );

      router.push('/dashboard');
    } catch (error: any) {
      // Mostrar mensaje legible
      throw new Error(error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    try {
      setIsLoading(true);
      const response = await api.register({ username, email, password, role });
      await login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🔒 Manual logout initiated');
    handleAutoLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        user: useAuthStore((state) => state.user),
        token: useAuthStore((state) => state.token),
        isAuthenticated: useAuthStore((state) => state.isAuthenticated),
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const AuthContext = React.createContext<{
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;
  logout: () => Promise<void>;
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Also export the Zustand hook directly for components that want to use it
export { useAuth as useAuthZustand } from '@/stores/auth.store';
