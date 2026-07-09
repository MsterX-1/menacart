using System;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.CouponDtos
{
    public class CreateCouponDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Percentage|Fixed)$", ErrorMessage = "DiscountType must be Percentage or Fixed.")]
        public string DiscountType { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000.00)]
        public decimal DiscountValue { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }

        public int? UsageLimit { get; set; }

        public decimal? MinOrderAmount { get; set; }
        
        public int? SellerId { get; set; }
    }
}
