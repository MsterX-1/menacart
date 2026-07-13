import { apiClient } from '../../../api/client';
import type { NotificationItem } from '../../../types/notification';

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const response = await apiClient.get<NotificationItem[]>('/notifications');
  return response.data;
};

export const markAsRead = async (notificationId: number): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<{ message: string }> => {
  const response = await apiClient.patch<{ message: string }>('/notifications/read-all');
  return response.data;
};
