namespace Application.DTOs.PaymentDtos
{
    public class PaymentSessionResponseDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string PaymentUrl { get; set; } = string.Empty;
    }
}
