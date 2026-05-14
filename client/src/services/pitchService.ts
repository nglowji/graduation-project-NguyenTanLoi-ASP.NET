import api from './api';

export interface PitchResponse {
  id: string;
  ownerId?: string;
  name: string;
  description?: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    fullAddress: string;
    latitude?: number;
    longitude?: number;
  };
  type?: number | string;
  typeDisplay: string;
  minPrice: number;
  maxPrice?: number;
  averageRating: number;
  totalReviews: number;
  status?: number | string;
  images: { id?: string; imageUrl: string, isPrimary?: boolean; displayOrder?: number }[];
  timeSlots?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    price: number;
    currency: string;
    isActive: boolean;
    isAvailable?: boolean;
  }>;
  reviews?: Array<{
    id: string;
    userName: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
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
