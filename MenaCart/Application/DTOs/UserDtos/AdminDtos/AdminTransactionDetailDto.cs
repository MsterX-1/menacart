namespace Application.DTOs.UserDtos.AdminDtos
{
    public class AdminTransactionDetailDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PlatformDiscount { get; set; }
        public string? CouponCode { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        public List<AdminSubOrderDto> SubOrders { get; set; } = new();
    }

    public class AdminSubOrderDto
    {
        public int SubOrderId { get; set; }
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
        public decimal SubOrderTotal { get; set; }
        public string? Carrier { get; set; }
        public string? TrackingNumber { get; set; }
        public List<AdminOrderItemDto> Items { get; set; } = new();
    }

    public class AdminOrderItemDto
    {
        public string ProductName { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtPurchase { get; set; }
        public decimal SaleAmount { get; set; }
    }
}
