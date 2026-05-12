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
    return await api.post('/bookings', request);
  },

  getById: async (id: string): Promise<BookingResponse> => {
    return await api.get(`/bookings/${id}`);
  },

  getMyBookings: async (): Promise<BookingResponse[]> => {
    return await api.get('/bookings/my-bookings');
  }
};
