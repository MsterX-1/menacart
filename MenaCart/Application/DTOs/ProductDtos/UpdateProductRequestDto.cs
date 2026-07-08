using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ProductDtos
{
    public class UpdateProductRequestDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        public string? Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? BasePrice { get; set; }

        [MaxLength(100)]
        public string? Brand { get; set; }

        public int? CategoryId { get; set; }

        public List<string>? ProductImages { get; set; }

        // Optional: pass variants to add or update
        public List<UpdateVariantDto>? Variants { get; set; }
    }
}
