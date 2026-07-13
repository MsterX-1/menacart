import { apiClient } from '../../../api/client';
import type { User } from '../../../types/auth';

export interface UpdateUserRequest {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/User/GetUserById/${id}`);
  return response.data;
};

export const updateUser = async (data: UpdateUserRequest): Promise<{ message: string }> => {
  const response = await apiClient.put<{ message: string }>('/User/UpdateUser', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<string> => {
  const response = await apiClient.put<string>('/User/ChangePassword', data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/User/DeleteUser/${id}`);
  return response.data;
};
