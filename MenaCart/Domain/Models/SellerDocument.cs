using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum SellerDocumentStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class SellerDocument
    {
        [Key]
        public int SellerDocumentId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        [MaxLength(50)]
        public string DocumentType { get; set; }

        [Required]
        [MaxLength(500)]
        public string DocumentUrl { get; set; }

        [Required]
        public SellerDocumentStatus Status { get; set; } = SellerDocumentStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }
    }
}
