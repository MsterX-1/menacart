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
        public string? StripeAccountId { get; set; }
        public decimal? CommissionRate { get; set; }
        public decimal? BaseShippingCost { get; set; }
        public decimal? FreeShippingThreshold { get; set; }
        public int ReturnPolicyDays { get; set; }
        
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountHolder { get; set; }
        public string? Iban { get; set; }
        
        public System.Collections.Generic.List<string> DeliveryProviders { get; set; } = new();

        public DateTime CreatedAt { get; set; }
    }
}
