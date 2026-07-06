using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ProductDtos
{
    public class CreateVariantDto
    {
        [Required]
        [MaxLength(50)]
        public string Sku { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Color { get; set; }

        [MaxLength(20)]
        public string? Size { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
