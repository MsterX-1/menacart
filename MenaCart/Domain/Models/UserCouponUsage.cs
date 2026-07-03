using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class UserCouponUsage
    {
        [Key]
        public int UsageId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public int CouponId { get; set; }

        [Required]
        public int OrderId { get; set; }

        public DateTime UsedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        [ForeignKey(nameof(CouponId))]
        public Coupon Coupon { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order Order { get; set; }
    }
}
