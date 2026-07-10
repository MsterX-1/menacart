import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notificationsApi';

export const notificationKeys = {
  all: ['notifications'] as const,
};

export const useNotifications = (enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
    enabled,
    refetchInterval: 15000, // Poll every 15 seconds for real-time notification alerts
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
