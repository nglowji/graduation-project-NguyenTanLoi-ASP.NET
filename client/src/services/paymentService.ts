import api from './api';

export interface CreatePaymentRequest {
  bookingId: string;
  returnUrl: string;
}

export interface CreatePaymentResponse {
  paymentUrl: string;
}

export interface PaymentTransactionDto {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  createdAt: string;
  providerTxnId?: string;
  message?: string;
}

export const paymentService = {
  createPayment: async (request: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await api.post('/payments/create', request);
    return response.data;
  },

  getTransaction: async (transactionId: string): Promise<PaymentTransactionDto> => {
    const response = await api.get(`/payments/transactions/${transactionId}`);
    return response.data;
  },

  getMyHistory: async (pageNumber = 1, pageSize = 10): Promise<any> => {
    const response = await api.get('/payments/my-history', {
      params: { pageNumber, pageSize }
    });
    return response.data;
  }
};
