import api from './api';

export interface ChatRecommendation {
  pitchId: string;
  pitchName: string;
  score: number;
  reasons: string[];
  estimatedPrice?: number;
  distanceKm?: number;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
  recommendations?: ChatRecommendation[];
  timestamp: string;
}

export const aiService = {
  chat: async (message: string, sessionId?: string): Promise<ChatResponse> => {
    return await api.post('/ai/chat', { message, sessionId });
  },
};
