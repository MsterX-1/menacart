using System.Collections.Generic;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class AdminDashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalSellers { get; set; }
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PendingSellerApplications { get; set; }
        public int PendingPayouts { get; set; }
        public decimal PlatformCommissionProfit { get; set; }
        public List<TopProductDto> TopProducts { get; set; } = new List<TopProductDto>();
        public List<SellerRevenueDto> SellerRevenues { get; set; } = new List<SellerRevenueDto>();
    }

    public class TopProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal Revenue { get; set; }
        public double AverageRating { get; set; }
    }

    public class SellerRevenueDto
    {
        public int SellerId { get; set; }
        public string StoreName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public decimal PendingPayoutBalance { get; set; }
    }
}
