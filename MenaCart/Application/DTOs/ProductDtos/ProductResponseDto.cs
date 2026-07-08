using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.ProductDtos
{
    public class ProductResponseDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public string? Brand { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsActive { get; set; }
        public string? RejectionReason { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<VariantResponseDto> Variants { get; set; } = new();
    }
}
