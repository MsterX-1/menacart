using System;
using System.Collections.Generic;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class AdminTransactionDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminTransactionsPagedResponseDto
    {
        public IEnumerable<AdminTransactionDto> Items { get; set; } = new List<AdminTransactionDto>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
    }
}
