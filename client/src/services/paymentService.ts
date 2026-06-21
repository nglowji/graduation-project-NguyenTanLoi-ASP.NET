import api from './api';

export type PaymentProvider = 'VNPAY' | 'ZALOPAY';

export interface CreatePaymentRequest {
  bookingId: string;
  returnUrl: string;
  provider: PaymentProvider;
}

export interface CreatePaymentResponse {
  paymentUrl: string;
  provider: PaymentProvider;
  transactionId: string;
  qrCode?: string | null;
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
  failureReason?: string | null;
  refundReason?: string | null;
  message?: string;
}

export const paymentService = {
  createPayment: async (request: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    return await api.post('/payments/create', request);
  },

  getTransaction: async (transactionId: string): Promise<PaymentTransactionDto> => {
    return await api.get(`/payments/transactions/${transactionId}`);
  },

  getMyHistory: async (pageNumber = 1, pageSize = 10): Promise<any> => {
    return await api.get('/payments/my-history', {
      params: { pageNumber, pageSize }
    });
  }
};
