using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum OrderStatus
    {
        Placed,
        Confirmed,
        Cancelled,
        Completed
    }

    public enum OrderPaymentStatus
    {
        Pending,
        Paid,
        Failed,
        Refunded
    }

    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public int AddressId { get; set; }

        public int? CouponId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        public OrderStatus Status { get; set; } = OrderStatus.Placed;

        [Required]
        public OrderPaymentStatus PaymentStatus { get; set; } = OrderPaymentStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        [ForeignKey(nameof(AddressId))]
        public Address Address { get; set; }

        [ForeignKey(nameof(CouponId))]
        public Coupon Coupon { get; set; }

        public ICollection<SubOrder> SubOrders { get; set; }
        public ICollection<Payment> Payments { get; set; }
        public ICollection<UserCouponUsage> UserCouponUsages { get; set; }
    }
}
