using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class ProductVariant
    {
        [Key]
        public int VariantId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Sku { get; set; }

        [MaxLength(50)]
        public string Color { get; set; }

        [MaxLength(20)]
        public string Size { get; set; }

        public int StockQuantity { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string ImageUrl { get; set; }

        /// <summary>Optimistic concurrency token backing SQL Server ROWVERSION.</summary>
        [Timestamp]
        public byte[] RowVersion { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(ProductId))]
        public Product Product { get; set; }

        public ICollection<CartItem> CartItems { get; set; }
        public ICollection<Wishlist> WishlistEntries { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }
        public ICollection<Return> ExchangeReturns { get; set; }
        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}
