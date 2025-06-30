'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api';
import { UserRole, User } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const {
    login: zustandLogin,
    logout: zustandLogout,
    isAuthenticated,
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize loading state - Zustand with persist will handle state restoration
    setIsLoading(false);

    // Listen for storage changes (logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cactus-auth-storage' && e.newValue === null) {
        // Storage was cleared in another tab, logout here too
        zustandLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [zustandLogout]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const tokenResponse = await apiClient.login({
        username: username,
        password: password,
      });

      const { access_token } = tokenResponse;

      // Create mock user object (in real app, decode JWT or fetch user data)
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

      // Use Zustand login action
      zustandLogin(mockUser, access_token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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

      // Create the user
      await apiClient.register({
        username,
        email,
        password,
        role,
      });

      // After successful registration, automatically log in
      await login(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    zustandLogout();
    router.push('/login');
  };

  // Create a compatibility layer for existing components
  const { user, token } = useAuthStore();
  const authContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Keep the existing context for backward compatibility during transition
const AuthContext = React.createContext<any>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Also export the Zustand hook directly for components that want to use it
export { useAuth as useAuthZustand } from '@/stores/auth.store';
