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
    const response = await api.get('/pitches/search', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<PitchResponse> => {
    const response = await api.get(`/pitches/${id}`);
    return response.data;
  }
};
