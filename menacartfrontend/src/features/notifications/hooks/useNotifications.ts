import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notificationsApi';
import { useAuth } from '../../../context/AuthContext';

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
};

export const useNotifications = (enabled = true) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: notificationKeys.all(user?.userId || 'anonymous'),
    queryFn: getNotifications,
    enabled: enabled && !!user,
    refetchInterval: 15000, // Poll every 15 seconds for real-time notification alerts
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all(user?.userId || 'anonymous') });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all(user?.userId || 'anonymous') });
    },
  });
};
