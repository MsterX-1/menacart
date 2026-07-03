using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class OrderItem
    {
        [Key]
        public int OrderItemId { get; set; }

        /// <summary>Seller is resolved via SubOrders.SellerId — no redundant SellerId here.</summary>
        [Required]
        public int SubOrderId { get; set; }

        [Required]
        public int VariantId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal PriceAtPurchase { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SubOrderId))]
        public SubOrder SubOrder { get; set; }

        [ForeignKey(nameof(VariantId))]
        public ProductVariant ProductVariant { get; set; }

        public ICollection<Return> Returns { get; set; }
        public ICollection<SellerCommission> SellerCommissions { get; set; }
    }
}
