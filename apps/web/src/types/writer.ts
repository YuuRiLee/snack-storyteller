export interface Writer {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  imageUrl: string | null;
  genre: string[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  _count: {
    stories: number;
  };
}

export interface CreateWriterDto {
  name: string;
  description: string;
  systemPrompt: string;
  genre: string[];
  imageUrl?: string;
  isPublic?: boolean;
}

export type UpdateWriterDto = Partial<CreateWriterDto>;

export interface WriterSearchParams {
  q?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

export interface WriterListResponse {
  data: Writer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
