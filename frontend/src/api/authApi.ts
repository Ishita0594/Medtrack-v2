import axiosClient from './axiosClient';
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth';

export const authApi = {
  async register(payload: RegisterPayload) {
    const response = await axiosClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await axiosClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
};
