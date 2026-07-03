using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum ShippingStatus
    {
        Pending,
        Shipped,
        InTransit,
        Delivered,
        Returned
    }

    public class Shipping
    {
        [Key]
        public int ShipmentId { get; set; }

        /// <summary>One shipment per seller's portion of the order.</summary>
        [Required]
        public int SubOrderId { get; set; }

        [MaxLength(100)]
        public string Carrier { get; set; }

        [MaxLength(100)]
        public string TrackingNumber { get; set; }

        [Required]
        public ShippingStatus Status { get; set; } = ShippingStatus.Pending;

        public DateTime? EstimatedDelivery { get; set; }

        public DateTime? ShippedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SubOrderId))]
        public SubOrder SubOrder { get; set; }
    }
}
