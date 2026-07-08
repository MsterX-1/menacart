using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.SellerDtos
{
    public class ApplySellerDto
    {
        [Required]
        [MaxLength(150)]
        public string StoreName { get; set; } = string.Empty;

        public string StoreDescription { get; set; } = string.Empty;

        [MaxLength(500)]
        public string StoreLogoUrl { get; set; } = string.Empty;

        [MaxLength(500)]
        public string StoreBannerUrl { get; set; } = string.Empty;

        [MaxLength(300)]
        public string StoreAddress { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? StripeAccountId { get; set; }
    }
}
