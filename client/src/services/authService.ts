import api from './api';

export const UserRole = {
  Customer: 1,
  PitchOwner: 2,
  Admin: 3
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: UserRoleType;
  token: string;
  expiresAt: string;
}

export const authService = {
  login: async (command: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', command);
    return response.data;
  },
  
  register: async (command: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', command);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
