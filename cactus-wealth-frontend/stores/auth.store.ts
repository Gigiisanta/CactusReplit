import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'cactus-auth-storage',
      // Only persist token and user, isAuthenticated is computed
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      // Rehydrate isAuthenticated based on token existence
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);

// Export hook for easy consumption
export const useAuth = useAuthStore; 