using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ReturnDtos
{
    public class CreateReturnRequestDto
    {
        [Required]
        public int OrderItemId { get; set; }

        [Required]
        [RegularExpression("^(Return|Exchange)$",
            ErrorMessage = "Type must be 'Return' or 'Exchange'.")]
        public string Type { get; set; } = string.Empty;

        /// <summary>Required only when Type = Exchange.</summary>
        public int? ExchangeVariantId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }
}
