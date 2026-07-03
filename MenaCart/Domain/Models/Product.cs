using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum ApprovalStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        public string Description { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal BasePrice { get; set; }

        [MaxLength(100)]
        public string Brand { get; set; }

        [Required]
        public ApprovalStatus ApprovalStatus { get; set; } = Models.ApprovalStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category Category { get; set; }

        public ICollection<ProductImage> ProductImages { get; set; }
        public ICollection<ProductVariant> ProductVariants { get; set; }
        public ICollection<Review> Reviews { get; set; }
    }
}
