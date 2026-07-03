using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class Wishlist
    {
        [Key]
        public int WishlistId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public int VariantId { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        [ForeignKey(nameof(VariantId))]
        public ProductVariant ProductVariant { get; set; }
    }
}
