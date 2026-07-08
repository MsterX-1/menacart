using System;

namespace Application.DTOs.WishlistDtos
{
    public class WishlistResponseDto
    {
        public int WishlistId { get; set; }
        public int VariantId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string? MainImageUrl { get; set; }
        public DateTime AddedAt { get; set; }
    }
}
