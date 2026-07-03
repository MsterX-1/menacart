using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum SubOrderStatus
    {
        Placed,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }

    /// <summary>
    /// One row per seller-within-an-order: allows shipping, commission,
    /// and fulfillment status to be tracked per seller within a single
    /// multi-vendor checkout.
    /// </summary>
    public class SubOrder
    {
        [Key]
        public int SubOrderId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        public SubOrderStatus Status { get; set; } = SubOrderStatus.Placed;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(OrderId))]
        public Order Order { get; set; }

        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; }
        public Shipping Shipping { get; set; }
    }
}
