using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.ProductDtos
{
    public class VariantResponseDto
    {
        public int VariantId { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int StockQuantity { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public List<string> VariantImages { get; set; } = new();
    }
}
