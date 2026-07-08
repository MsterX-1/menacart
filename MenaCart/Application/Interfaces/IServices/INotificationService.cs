using Application.DTOs.NotificationDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationResponseDto>> GetNotificationsAsync(string userId);
        Task MarkAsReadAsync(string userId, int notificationId);
        Task MarkAllAsReadAsync(string userId);
        Task CreateNotificationAsync(string userId, string message, string? linkUrl = null);
    }
}
