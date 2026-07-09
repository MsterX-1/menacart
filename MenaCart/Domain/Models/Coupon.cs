using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum DiscountType
    {
        Percentage,
        Fixed
    }

    public class Coupon
    {
        [Key]
        public int CouponId { get; set; }

        public int? SellerId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        public DiscountType DiscountType { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? MinOrderAmount { get; set; }

        [Required]
        public DateTime ExpiryDate { get; set; }

        /// <summary>Global usage cap. Null = unlimited.</summary>
        public int? UsageLimit { get; set; }

        public int UsedCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }

        public ICollection<Order> Orders { get; set; }
        public ICollection<UserCouponUsage> UserCouponUsages { get; set; }
    }
}
