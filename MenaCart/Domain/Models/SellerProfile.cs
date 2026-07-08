using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum SellerStatus
    {
        Pending,
        Active,
        Suspended,
        Rejected
    }

    /// <summary>
    /// The canonical seller identity. Every other seller-owning table
    /// points here via SellerId, never directly at ApplicationUser.Id.
    /// </summary>
    public class SellerProfile
    {
        [Key]
        public int SellerId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [MaxLength(150)]
        public string StoreName { get; set; }

        public string StoreDescription { get; set; }

        [MaxLength(500)]
        public string StoreLogoUrl { get; set; }

        [MaxLength(500)]
        public string StoreBannerUrl { get; set; }

        [MaxLength(300)]
        public string StoreAddress { get; set; }

        [MaxLength(20)]
        public string Phone { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;

        public bool IsVerified { get; set; } = false;

        [Required]
        public SellerStatus Status { get; set; } = SellerStatus.Pending;

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        [MaxLength(100)]
        public string? StripeAccountId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        public ICollection<SellerDocument> SellerDocuments { get; set; }
        public ICollection<SellerBankInfo> SellerBankInfos { get; set; }
        public ICollection<SellerShippingRule> SellerShippingRules { get; set; }
        public ICollection<SellerReview> SellerReviews { get; set; }
        public ICollection<Product> Products { get; set; }
        public ICollection<SubOrder> SubOrders { get; set; }
        public ICollection<SellerCommission> SellerCommissions { get; set; }
        public ICollection<SellerPayout> SellerPayouts { get; set; }
    }
}
