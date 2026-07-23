import api from './api';

export const UserRole = {
  Customer: 1,
  PitchOwner: 2,
  Admin: 3,
  PitchStaff: 4
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRoleType;
  token: string;
  expiresAt: string;
  address?: string;
  mapLink?: string;
  avatar?: string;
  emailConfirmed?: boolean;
  hasSubmittedOwnerRegistration?: boolean;
}

export interface OwnerRegistrationStatus {
  hasSubmitted: boolean;
  status: 'none' | 'submitted' | 'pending' | 'approved' | string;
  sportCenterId?: string | null;
  sportCenterName?: string | null;
  submittedAt?: string | null;
}

export const authService = {
  login: async (command: any): Promise<AuthResponse> => {
    return await api.post('/auth/login', command);
  },

  googleLogin: async (accessToken: string): Promise<AuthResponse> => {
    return await api.post('/auth/google-login', { accessToken });
  },

  facebookLogin: async (accessToken: string): Promise<AuthResponse> => {
    return await api.post('/auth/facebook-login', { accessToken });
  },
  
  register: async (command: any): Promise<AuthResponse> => {
    return await api.post('/auth/register', command);
  },

  registerOwnerCenter: async (command: any): Promise<AuthResponse> => {
    return await api.post('/auth/register-owner-center', command);
  },

  getOwnerRegistrationStatus: async (): Promise<OwnerRegistrationStatus> => {
    return await api.get('/auth/owner-registration-status');
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  verifyResetOtp: async (email: string, otp: string): Promise<{ resetToken: string }> => {
    return await api.post('/auth/verify-reset-otp', { email, otp });
  },

  resetPassword: async (email: string, resetToken: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { email, resetToken, newPassword });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
