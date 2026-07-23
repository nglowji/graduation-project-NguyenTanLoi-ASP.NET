import api from './api';

export interface CreateBookingRequest {
  timeSlotId: string;
  bookingDate: string;
  selectedServices?: Array<{
    serviceId: string;
    quantity: number;
  }>;
}

export interface CreateMultiSlotBookingRequest {
  timeSlots: Array<{
    timeSlotId: string;
    bookingDate: string;
  }>;
  selectedServices?: CreateBookingRequest['selectedServices'];
}

export interface BookingLockResponse {
  lockId: string;
  expiresAt?: string;
  durationMinutes?: number;
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
  createdAt?: string;
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

type CreateBookingApiResult = string | {
  id?: string;
  data?: string;
  value?: string;
};

type CreateMultiSlotBookingApiResult = string[] | {
  data?: string[];
  value?: string[];
  bookingIds?: string[];
};

const extractBookingId = (result: CreateBookingApiResult) => {
  if (typeof result === 'string') return result;
  return result.id || result.data || result.value;
};

const extractBookingIds = (result: CreateMultiSlotBookingApiResult) => {
  if (Array.isArray(result)) return result;
  return result.bookingIds || result.data || result.value || [];
};

export const bookingService = {
  lock: async (timeSlotId: string, bookingDate: string): Promise<BookingLockResponse> => {
    return await api.post('/bookings/lock', { timeSlotId, bookingDate });
  },

  releaseLock: async (lockId: string): Promise<void> => {
    await api.post(`/bookings/release-lock/${lockId}`);
  },

  create: async (request: CreateBookingRequest): Promise<BookingResponse> => {
    const bookingResult = await api.post('/bookings', request) as CreateBookingApiResult;
    const bookingId = extractBookingId(bookingResult);

    if (!bookingId) {
      throw new Error('Booking was created but the API did not return a booking id.');
    }

    return await bookingService.getById(bookingId);
  },

  getById: async (id: string): Promise<BookingResponse> => {
    return await api.get(`/bookings/${id}`);
  },

  createMultiSlot: async (request: CreateMultiSlotBookingRequest): Promise<BookingResponse[]> => {
    const bookingResult = await api.post('/bookings/multi-slot', request) as CreateMultiSlotBookingApiResult;
    const bookingIds = extractBookingIds(bookingResult);

    if (bookingIds.length === 0) {
      throw new Error('Multi-slot booking was created but the API did not return booking ids.');
    }

    return await Promise.all(bookingIds.map((bookingId) => bookingService.getById(bookingId)));
  },

  getMyBookings: async (params?: { pageNumber?: number; pageSize?: number; status?: string }): Promise<any> => {
    return await api.get('/bookings/my-bookings', { params });
  },

  cancel: async (id: string, reason: string): Promise<void> => {
    await api.patch(`/bookings/${id}/cancel`, { reason });
  }
};
