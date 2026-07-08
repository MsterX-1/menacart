using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ProductDtos
{

    public class CreateProductRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal BasePrice { get; set; }

        [MaxLength(100)]
        public string? Brand { get; set; }

        [Required]
        public int CategoryId { get; set; }

        public List<string>? ProductImages { get; set; } = new();

        [Required]
        [MinLength(1, ErrorMessage = "At least one variant is required.")]
        public List<CreateVariantDto> Variants { get; set; } = new();
    }
}
