import { apiClient } from '../../../api/client';
import type { AuthResponse, RegisterRequestData, User } from '../../../types/auth';
import type { LoginDto } from './types';

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/Login', dto);
  return response.data;
};

export const registerUser = async (data: RegisterRequestData): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/Register', data);
  return response.data;
};

export const verifyOtp = async (data: { email: string; code: string }): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/VerifyOtp', data);
  return response.data;
};

export const resendOtp = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/ResendOtp', { email });
  return response.data;
};

export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/GoogleLogin', { idToken, role: 'Customer' });
  return response.data;
};

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post('/auth/ForgotPassword', { email });
};

export const resetPassword = async (data: { email: string; token: string; newPassword: string }): Promise<void> => {
  await apiClient.post('/auth/ResetPassword', data);
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
