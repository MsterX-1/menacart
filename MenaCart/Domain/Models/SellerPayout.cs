using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum SellerPayoutStatus
    {
        Pending,
        Processing,
        Paid,
        Failed
    }

    public class SellerPayout
    {
        [Key]
        public int PayoutId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        public SellerPayoutStatus Status { get; set; } = SellerPayoutStatus.Pending;

        [Required]
        [MaxLength(30)]
        public string PaymentMethod { get; set; }

        [MaxLength(100)]
        public string TransactionRef { get; set; }

        public DateTime? PayoutDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }
    }
}
