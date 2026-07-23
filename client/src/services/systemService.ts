import api from './api';

export interface CheckoutSettings {
  bookingHoldMinutes: number;
  depositPercentage: number;
}

const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  bookingHoldMinutes: 10,
  depositPercentage: 10,
};

const normalizeCheckoutSettings = (value: any): CheckoutSettings => ({
  bookingHoldMinutes: Number(value?.bookingHoldMinutes ?? DEFAULT_CHECKOUT_SETTINGS.bookingHoldMinutes),
  depositPercentage: Number(value?.depositPercentage ?? DEFAULT_CHECKOUT_SETTINGS.depositPercentage),
});

export const systemService = {
  getCheckoutSettings: async (): Promise<CheckoutSettings> => {
    try {
      const result = await api.get('/system/checkout');
      return normalizeCheckoutSettings(result);
    } catch {
      return DEFAULT_CHECKOUT_SETTINGS;
    }
  },
};
