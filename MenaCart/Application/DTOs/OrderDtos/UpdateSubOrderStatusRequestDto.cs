using System.ComponentModel.DataAnnotations;


namespace Application.DTOs.OrderDtos
{
    public class UpdateSubOrderStatusRequestDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        // Required only when Status == "Shipped"
        public string? Carrier { get; set; }
        public string? TrackingNumber { get; set; }
    }
}