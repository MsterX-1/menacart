using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.PaymentDtos
{
    public class PaymentWebhookDto
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        public string TransactionId { get; set; } = string.Empty;

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
