using System;

namespace Application.DTOs.PayoutDtos
{
    public class PayoutResponseDto
    {
        public int PayoutId { get; set; }
        public int SellerId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? TransactionRef { get; set; }
        public DateTime? PayoutDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
