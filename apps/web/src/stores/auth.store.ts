import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import type { User, AuthResponse, LoginDto, RegisterDto } from '../types';
import { api } from '../lib/api';

interface ApiErrorResponse {
  message: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    return (error.response.data as ApiErrorResponse).message || fallback;
  }
  return fallback;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (dto: LoginDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/login', dto);
          const { access_token, user } = response.data;

          localStorage.setItem('access_token', access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Login failed'),
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (dto: RegisterDto) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', dto);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Registration failed'),
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
