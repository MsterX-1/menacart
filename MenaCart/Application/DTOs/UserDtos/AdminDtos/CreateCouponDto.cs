using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class CreateCouponDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Percentage|Fixed)$",
            ErrorMessage = "DiscountType must be 'Percentage' or 'Fixed'.")]
        public string DiscountType { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal DiscountValue { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? MinOrderAmount { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Range(1, int.MaxValue)]
        public int? UsageLimit { get; set; }
    }
}
