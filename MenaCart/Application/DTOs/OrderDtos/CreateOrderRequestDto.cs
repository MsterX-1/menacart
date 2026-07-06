namespace Application.DTOs.OrderDtos
{
    public class CreateOrderRequestDto
    {
        public int? AddressId { get; set; }
        public string? CouponCode { get; set; }
    }
}