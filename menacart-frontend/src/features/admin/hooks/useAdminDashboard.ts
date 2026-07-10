import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats } from '../api/adminDashboardApi';

export const adminDashboardKeys = {
  all: ['admin-dashboard-stats'] as const,
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: getAdminDashboardStats,
    refetchInterval: 30000, // optionally auto-refresh every 30 seconds
  });
};
