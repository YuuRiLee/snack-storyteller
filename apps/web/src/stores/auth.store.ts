import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import type { User, AuthResponse, LoginDto, RegisterDto } from '../types';
import { api } from '../lib/api';

interface ApiErrorResponse {
  message: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    // Handle various error response formats
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) {
      return data.message;
    }
    // Handle specific HTTP status codes
    switch (error.response?.status) {
      case 401:
        return '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
      case 409:
        return '이미 가입된 이메일입니다.';
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      return '인터넷 연결을 확인해주세요.';
    }
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
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
            error: getErrorMessage(error, '로그인에 실패했습니다. 다시 시도해주세요.'),
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
            error: getErrorMessage(error, '회원가입에 실패했습니다. 다시 시도해주세요.'),
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
