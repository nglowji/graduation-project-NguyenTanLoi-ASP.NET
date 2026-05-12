import api from './api';

export interface PitchResponse {
  id: string;
  name: string;
  description: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  latitude: number;
  longitude: number;
  pitchTypes: string;
  basePrice: number;
  averageRating: number;
  totalReviews: number;
  images: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

export const pitchService = {
  search: async (params?: any): Promise<PaginatedResult<PitchResponse>> => {
    return await api.get('/pitches/search', { params });
  },
  
  getById: async (id: string): Promise<PitchResponse> => {
    return await api.get(`/pitches/${id}`);
  },

  create: async (payload: any): Promise<any> => {
    return await api.post('/pitches', payload);
  },

  update: async (id: string, payload: any): Promise<void> => {
    await api.put(`/pitches/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/pitches/${id}`);
  }
};
