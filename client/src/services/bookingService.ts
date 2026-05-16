import api from './api';

export interface CreateBookingRequest {
  timeSlotId: string;
  bookingDate: string;
  selectedServices?: Array<{
    serviceId: string;
    quantity: number;
  }>;
}

export interface BookingResponse {
  id: string;
  userId?: string;
  timeSlotId?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  pitchName: string;
  startTime: string;
  endTime: string;
  bookingDate: string;
  totalPrice: number;
  depositAmount?: number;
  currency?: string;
  status: string;
  checkInCode?: string;
  services?: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    price: number;
    currency: string;
    quantity: number;
    lineTotal: number;
  }>;
  timeSlot?: {
    id: string;
    startTime: string;
    endTime: string;
    price?: number;
    currency?: string;
    pitch?: {
      id: string;
      name: string;
      type: string;
      address: string;
    };
  };
}

export const bookingService = {
  lock: async (timeSlotId: string, bookingDate: string): Promise<{ lockId: string }> => {
    return await api.post('/bookings/lock', { timeSlotId, bookingDate });
  },

  releaseLock: async (lockId: string): Promise<void> => {
    await api.post(`/bookings/release-lock/${lockId}`);
  },

  create: async (request: CreateBookingRequest): Promise<BookingResponse> => {
    const bookingResult = await api.post('/bookings', request) as any;
    const bookingId =
      typeof bookingResult === 'string'
        ? bookingResult
        : bookingResult?.id || bookingResult?.data || bookingResult?.value;

    if (!bookingId) {
      throw new Error('Booking was created but the API did not return a booking id.');
    }

    return await bookingService.getById(bookingId);
  },

  getById: async (id: string): Promise<BookingResponse> => {
    return await api.get(`/bookings/${id}`);
  },

  getMyBookings: async (params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<any> => {
    return await api.get('/bookings/my-bookings', { params });
  },

  cancel: async (id: string, reason: string): Promise<void> => {
    await api.patch(`/bookings/${id}/cancel`, { reason });
  }
};
