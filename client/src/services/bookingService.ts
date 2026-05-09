import api from './api';

export interface CreateBookingRequest {
  timeSlotId: string;
  bookingDate: string;
}

export interface BookingResponse {
  id: string;
  pitchName: string;
  startTime: string;
  endTime: string;
  bookingDate: string;
  totalPrice: number;
  status: string;
}

export const bookingService = {
  create: async (request: CreateBookingRequest): Promise<BookingResponse> => {
    const response = await api.post('/bookings', request);
    return response.data;
  },

  getById: async (id: string): Promise<BookingResponse> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  getMyBookings: async (): Promise<BookingResponse[]> => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  }
};
