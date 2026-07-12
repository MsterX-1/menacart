using System.Collections.Generic;

namespace Application.DTOs.CartDtos
{
    public class SellerShippingPreviewDto
    {
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
    }

    public class CheckoutPreviewDto
    {
        public decimal Subtotal { get; set; }
        public decimal TotalShippingCost { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal LoyaltyPointsToCurrencyRate { get; set; } = 100m;
        public List<SellerShippingPreviewDto> SellerShipping { get; set; } = new();
    }
}
