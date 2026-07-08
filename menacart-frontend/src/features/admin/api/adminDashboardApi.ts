import { apiClient } from '../../../api/client';
import type { AdminDashboardStats } from '../../../types/admin';

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await apiClient.get<AdminDashboardStats>('/admin/dashboard-stats');
  return response.data;
};
