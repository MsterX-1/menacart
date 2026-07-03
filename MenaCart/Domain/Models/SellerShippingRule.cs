using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class SellerShippingRule
    {
        [Key]
        public int RuleId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [MaxLength(100)]
        public string City { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal ShippingCost { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? FreeShippingAbove { get; set; }

        [Required]
        public int EstimatedDays { get; set; }

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }
    }
}
