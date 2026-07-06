using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ProductDtos
{

    public class UpdateVariantDto
    {
        public int? VariantId { get; set; }   // null = new variant

        [MaxLength(50)]
        public string? Sku { get; set; }

        [MaxLength(50)]
        public string? Color { get; set; }

        [MaxLength(20)]
        public string? Size { get; set; }

        [Range(0, int.MaxValue)]
        public int? StockQuantity { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Price { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
