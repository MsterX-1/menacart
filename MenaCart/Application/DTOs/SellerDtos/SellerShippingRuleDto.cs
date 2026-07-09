using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.SellerDtos
{
    public class SellerShippingRuleDto
    {
        public int RuleId { get; set; }
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
        public decimal? FreeShippingAbove { get; set; }
        public int EstimatedDays { get; set; }
    }

    public class CreateShippingRuleDto
    {
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [Required]
        public decimal ShippingCost { get; set; }

        public decimal? FreeShippingAbove { get; set; }

        [Required]
        public int EstimatedDays { get; set; }
    }
}
