import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    user_id: string;
    username: string;
    email: string;
    full_name: string;
    roles: string[];
    permissions: string[];
  } | null;
  setToken: (token: string) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
      hasPermission: (permission) => {
        const { user } = get();
        return user?.permissions.includes(permission) || false;
      },
      hasRole: (role) => {
        const { user } = get();
        return user?.roles.includes(role) || false;
      },
    }),
    {
      name: 'rag3-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);