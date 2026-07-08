namespace Application.DTOs.OrderDtos
{
    public class OrderItemDto
    {
        public int OrderItemId { get; set; }
        public int VariantId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtPurchase { get; set; }
    }

    public class SubOrderDto
    {
        public int SubOrderId { get; set; }
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderConfirmationResponseDto
    {
        public int OrderId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentUrl { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<SubOrderDto> SubOrders { get; set; } = new();
    }
}