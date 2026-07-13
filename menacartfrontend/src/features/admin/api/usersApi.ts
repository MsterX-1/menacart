import { apiClient } from '../../../api/client';
import type { User } from '../../../types/auth';

// User type returned with roles
export interface AdminUser extends User {
  roles: string[];
}

export const getAllUsers = async (): Promise<AdminUser[]> => {
  const response = await apiClient.get<AdminUser[]>('/user/GetAllUsers');
  return response.data;
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/user/DeleteUser/${userId}`);
  return response.data;
};
