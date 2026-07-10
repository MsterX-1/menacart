using System;

namespace Application.DTOs.NotificationDtos
{
    public class NotificationResponseDto
    {
        public int NotificationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? LinkUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
