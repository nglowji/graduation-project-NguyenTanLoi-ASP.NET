import api from './api';

export interface ReviewResponse {
  id: string;
  userName: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  ownerReply?: string | null;
  createdAt: string;
}

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
  mapLink?: string | null;
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
  reviews?: ReviewResponse[];
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

  getReviews: async (id: string): Promise<PaginatedResult<ReviewResponse>> => {
    return await api.get(`/pitches/${id}/reviews`, {
      params: { pageNumber: 1, pageSize: 10 },
    });
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
