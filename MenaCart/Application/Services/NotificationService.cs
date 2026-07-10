using Application.DTOs.NotificationDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<NotificationResponseDto>> GetNotificationsAsync(string userId)
        {
            var list = await _unitOfWork.NotificationRepository.GetByUserIdAsync(userId);
            return list.Select(n => new NotificationResponseDto
            {
                NotificationId = n.NotificationId,
                Message = n.Message,
                LinkUrl = n.LinkUrl,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            }).ToList();
        }

        public async Task MarkAsReadAsync(string userId, int notificationId)
        {
            var notification = await _unitOfWork.NotificationRepository.GetById(notificationId);
            if (notification == null)
            {
                throw new Exception("Notification not found.");
            }

            if (notification.UserId != userId)
            {
                throw new UnauthorizedAccessException("You are not authorized to access this notification.");
            }

            notification.IsRead = true;
            await _unitOfWork.NotificationRepository.Update(notification);
            await _unitOfWork.CompleteAsync();
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            await _unitOfWork.NotificationRepository.MarkAllAsReadForUserAsync(userId);
            await _unitOfWork.CompleteAsync();
        }

        public async Task CreateNotificationAsync(string userId, string message, string? linkUrl = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Message = message,
                LinkUrl = linkUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.NotificationRepository.Add(notification);
            await _unitOfWork.CompleteAsync();
        }
    }
}
