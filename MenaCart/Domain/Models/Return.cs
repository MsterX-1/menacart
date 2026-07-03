using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum ReturnType
    {
        Return,
        Exchange
    }

    public enum ReturnStatus
    {
        Requested,
        Approved,
        Rejected,
        Completed
    }

    public class Return
    {
        [Key]
        public int ReturnId { get; set; }

        [Required]
        public int OrderItemId { get; set; }

        [Required]
        public ReturnType Type { get; set; } = ReturnType.Return;

        /// <summary>Populated when Type = Exchange.</summary>
        public int? ExchangeVariantId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? RefundAmount { get; set; }

        [Required]
        public ReturnStatus Status { get; set; } = ReturnStatus.Requested;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(OrderItemId))]
        public OrderItem OrderItem { get; set; }

        [ForeignKey(nameof(ExchangeVariantId))]
        public ProductVariant ExchangeVariant { get; set; }
    }
}
