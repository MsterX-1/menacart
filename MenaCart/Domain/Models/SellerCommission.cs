using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum SellerCommissionStatus
    {
        Pending,
        Settled,
        Refunded
    }

    public class SellerCommission
    {
        [Key]
        public int CommissionId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        public int OrderItemId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal SaleAmount { get; set; }

        /// <summary>Percentage.</summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal CommissionRate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal CommissionAmount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal SellerDiscount { get; set; } = 0;

        [Required]
        public SellerCommissionStatus Status { get; set; } = SellerCommissionStatus.Pending;

        public int? PayoutId { get; set; }

        [Timestamp]
        public byte[] RowVersion { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }

        [ForeignKey(nameof(OrderItemId))]
        public OrderItem OrderItem { get; set; }

        [ForeignKey(nameof(PayoutId))]
        public SellerPayout? SellerPayout { get; set; }
    }
}
