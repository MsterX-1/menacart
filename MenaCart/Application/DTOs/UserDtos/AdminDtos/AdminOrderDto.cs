using Application.DTOs.OrderDtos;
using System;
using System.Collections.Generic;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class AdminOrderSubOrderDto
    {
        public int SubOrderId { get; set; }
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal ShippingCost { get; set; }
        public decimal PlatformCommission { get; set; }
        public string? Carrier { get; set; }
        public string? TrackingNumber { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class AdminOrderDto
    {
        public int OrderId { get; set; }
        public string BuyerId { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerEmail { get; set; } = string.Empty;
        
        public string ShippingAddress { get; set; } = string.Empty;
        
        public decimal TotalAmount { get; set; }
        public decimal PlatformDiscount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string? PaymentUrl { get; set; }
        public string? SessionId { get; set; }
        public int? CouponId { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public List<AdminOrderSubOrderDto> SubOrders { get; set; } = new();
    }

    public class AdminOrdersPagedResponseDto
    {
        public IEnumerable<AdminOrderDto> Items { get; set; } = new List<AdminOrderDto>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
    }
}
