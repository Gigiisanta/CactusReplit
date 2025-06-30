'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { AuthContextType, User, UserRole } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored token on app initialization
    const storedToken = localStorage.getItem('cactus_token');
    if (storedToken) {
      setToken(storedToken);
      // In a real app, you'd validate the token here
      // For now, we'll assume it's valid if it exists
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const tokenResponse = await apiClient.login({
        username: username,
        password: password,
      });

      const { access_token } = tokenResponse;

      // Store token in localStorage
      localStorage.setItem('cactus_token', access_token);
      setToken(access_token);

      // In a real app, you'd decode the JWT or fetch user data
      // For now, we'll create a mock user object
      const mockUser: User = {
        id: 1,
        username: username,
        email: 'demo@cactuswealth.com', // Would come from token/API
        is_active: true,
        role: UserRole.JUNIOR_ADVISOR,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clients: [],
      };

      setUser(mockUser);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: UserRole) => {
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
    localStorage.removeItem('cactus_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
