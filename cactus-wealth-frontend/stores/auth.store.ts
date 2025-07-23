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
  clearStorage: () => void;
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
        console.log('🔒 Auth store: Login successful');
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        console.log('🔒 Auth store: Logout - clearing state');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        // Force clear localStorage as backup
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('cactus-auth-storage');
            console.log('🔒 Auth store: localStorage cleared');
          } catch (error) {
            console.error('Error clearing localStorage:', error);
          }
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearStorage: () => {
        console.log('🔒 Auth store: Manually clearing storage');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cactus-auth-storage');
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
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
          if (state.token) {
            console.log('🔒 Auth store: Token rehydrated from storage');
          }
        }
      },
    }
  )
);

// Export hook for easy consumption
export const useAuth = useAuthStore;
