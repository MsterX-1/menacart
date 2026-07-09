import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import './NotificationsDropdown.css';

interface NotificationsDropdownProps {
  onClose: () => void;
  isAuthenticated: boolean;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose, isAuthenticated }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useNotifications(isAuthenticated);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleNotificationClick = async (id: number, isRead: boolean, linkUrl?: string) => {
    if (!isRead) {
      await markAsReadMutation.mutateAsync(id);
    }
    onClose();
    if (linkUrl) {
      navigate(linkUrl);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsReadMutation.mutateAsync();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notifications-dropdown glass-card animate-fade-in" ref={dropdownRef}>
      <div className="notifications-dropdown-header">
        <h3 className="notifications-title">Notifications</h3>
        {notifications && notifications.some(n => !n.isRead) && (
          <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notifications-list-container">
        {isLoading ? (
          <div className="notifications-loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="empty-bell-icon">🔔</span>
            <p className="empty-text">All caught up!</p>
            <p className="empty-subtext">You'll see alerts here when they arrive.</p>
          </div>
        ) : (
          <div className="notifications-items-list">
            {notifications.map((n) => (
              <div
                key={n.notificationId}
                className={`notification-item-row ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(n.notificationId, n.isRead, n.linkUrl)}
              >
                <div className="notification-content-wrap">
                  <p 
                    className="notification-message-text" 
                    dangerouslySetInnerHTML={{ __html: n.message }}
                  ></p>
                  <span className="notification-time-label">{formatTime(n.createdAt)}</span>
                </div>
                {!n.isRead && <span className="unread-indicator-dot"></span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
