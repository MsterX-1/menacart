using System;

namespace Application.DTOs.ReviewDtos
{
    public class ReviewResponseDto
    {
        public int ReviewId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public byte Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
