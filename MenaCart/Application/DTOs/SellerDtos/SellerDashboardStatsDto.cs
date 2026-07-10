using System.Collections.Generic;

namespace Application.DTOs.SellerDtos
{
    public class SellerDashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal TotalCommissionPaid { get; set; }
        public decimal NetProfit { get; set; }
        public int TotalOrders { get; set; }
        public int TotalProducts { get; set; }
        public decimal PendingPayoutBalance { get; set; }
        public decimal AvailableBalance { get; set; }
        public decimal PendingBalance { get; set; }
        public List<TopSellerProductDto> TopProducts { get; set; } = new List<TopSellerProductDto>();
    }

    public class TopSellerProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal Revenue { get; set; }
        public double AverageRating { get; set; }
    }
}
