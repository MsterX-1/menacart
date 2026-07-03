using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class SellerReview
    {
        [Key]
        public int SellerReviewId { get; set; }

        [Required]
        public int SellerId { get; set; }

        /// <summary>ApplicationUser.Id of the reviewing buyer.</summary>
        [Required]
        public string CustomerId { get; set; }

        [Required]
        [Range(1, 5)]
        public byte Rating { get; set; }

        public string Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public User Customer { get; set; }
    }
}
