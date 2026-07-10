using System;
using System.Collections.Generic;

namespace Application.DTOs.SellerDtos
{
    public class PublicSellerProfileDto
    {
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string StoreDescription { get; set; } = string.Empty;
        public string StoreLogoUrl { get; set; } = string.Empty;
        public string StoreBannerUrl { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PublicSellerListResponseDto
    {
        public IEnumerable<PublicSellerProfileDto> Items { get; set; } = new List<PublicSellerProfileDto>();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
    }
}
