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
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
