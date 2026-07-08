using System;

namespace Application.DTOs.SellerDtos
{
    public class SellerProfileResponseDto
    {
        public int SellerId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string StoreName { get; set; } = string.Empty;
        public string StoreDescription { get; set; } = string.Empty;
        public string StoreLogoUrl { get; set; } = string.Empty;
        public string StoreBannerUrl { get; set; } = string.Empty;
        public string StoreAddress { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsVerified { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
