using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.PayoutDtos
{
    public class RequestPayoutDto
    {
        [Required]
        [MaxLength(30)]
        public string PaymentMethod { get; set; } = string.Empty;
    }
}
