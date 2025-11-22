import { create } from 'zustand';
import { AxiosError } from 'axios';
import type {
  Writer,
  WriterListResponse,
  WriterSearchParams,
  CreateWriterDto,
  UpdateWriterDto,
} from '../types';
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

interface WriterState {
  writers: Writer[];
  myWriters: Writer[];
  selectedWriter: Writer | null;
  genres: string[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWriters: (params?: WriterSearchParams) => Promise<void>;
  fetchMyWriters: (params?: WriterSearchParams) => Promise<void>;
  fetchWriter: (id: string) => Promise<Writer>;
  fetchGenres: () => Promise<void>;
  createWriter: (dto: CreateWriterDto) => Promise<Writer>;
  updateWriter: (id: string, dto: UpdateWriterDto) => Promise<Writer>;
  deleteWriter: (id: string) => Promise<void>;
  setSelectedWriter: (writer: Writer | null) => void;
  clearError: () => void;
}

export const useWriterStore = create<WriterState>((set) => ({
  writers: [],
  myWriters: [],
  selectedWriter: null,
  genres: [],
  meta: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  fetchWriters: async (params?: WriterSearchParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<WriterListResponse>('/writers', {
        params,
      });
      set({
        writers: response.data.data,
        meta: response.data.meta,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch writers'),
        isLoading: false,
      });
    }
  },

  fetchMyWriters: async (params?: WriterSearchParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<WriterListResponse>('/writers/my', {
        params,
      });
      set({
        myWriters: response.data.data,
        meta: response.data.meta,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch your writers'),
        isLoading: false,
      });
    }
  },

  fetchWriter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Writer>(`/writers/${id}`);
      set({ selectedWriter: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to fetch writer'),
        isLoading: false,
      });
      throw error;
    }
  },

  fetchGenres: async () => {
    try {
      const response = await api.get<string[]>('/writers/genres');
      set({ genres: response.data });
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    }
  },

  createWriter: async (dto: CreateWriterDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Writer>('/writers', dto);
      const newWriter = response.data;

      // Update local state
      set((state) => ({
        writers: [newWriter, ...state.writers],
        myWriters: [newWriter, ...state.myWriters],
        isLoading: false,
      }));

      return newWriter;
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to create writer'),
        isLoading: false,
      });
      throw error;
    }
  },

  updateWriter: async (id: string, dto: UpdateWriterDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<Writer>(`/writers/${id}`, dto);
      const updatedWriter = response.data;

      // Update local state
      set((state) => ({
        writers: state.writers.map((w) => (w.id === id ? updatedWriter : w)),
        myWriters: state.myWriters.map((w) => (w.id === id ? updatedWriter : w)),
        selectedWriter: state.selectedWriter?.id === id ? updatedWriter : state.selectedWriter,
        isLoading: false,
      }));

      return updatedWriter;
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update writer'),
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWriter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/writers/${id}`);

      // Update local state
      set((state) => ({
        writers: state.writers.filter((w) => w.id !== id),
        myWriters: state.myWriters.filter((w) => w.id !== id),
        selectedWriter: state.selectedWriter?.id === id ? null : state.selectedWriter,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete writer'),
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedWriter: (writer: Writer | null) => {
    set({ selectedWriter: writer });
  },

  clearError: () => set({ error: null }),
}));
