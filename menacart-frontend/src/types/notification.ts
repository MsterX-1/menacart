export interface NotificationItem {
  notificationId: number;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}
