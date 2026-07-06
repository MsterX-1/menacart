using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.ReturnDtos
{
    public class ReturnResponseDto
    {
        public int ReturnId { get; set; }
        public int OrderItemId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtPurchase { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? ExchangeVariantSku { get; set; }
        public string Reason { get; set; } = string.Empty;
        public decimal? RefundAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
