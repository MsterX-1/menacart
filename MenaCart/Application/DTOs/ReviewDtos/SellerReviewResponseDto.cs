using System;

namespace Application.DTOs.ReviewDtos
{
    public class SellerReviewResponseDto
    {
        public int SellerReviewId { get; set; }
        public int SellerId { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public byte Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
