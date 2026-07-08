import { apiClient } from '../../../api/client';
import type { AuthResponse, RegisterRequestData, User } from '../../../types/auth';
import type { LoginDto } from './types';

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/Login', dto);
  return response.data;
};

export const registerUser = async (data: RegisterRequestData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/Register', data);
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/auth/Logout');
};

export const logoutAllDevices = async (): Promise<void> => {
  await apiClient.post('/auth/LogoutAll');
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/RefreshToken');
  return response.data;
};
