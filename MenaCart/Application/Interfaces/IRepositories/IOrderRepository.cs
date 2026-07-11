using Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.UserDtos.AdminDtos;

namespace Application.Interfaces.IRepositories
{
    public interface IOrderRepository : IGenaricRepository<Order>
    {
        public Task<IEnumerable<Order>> GetByUserIdAsync(string userId, int page, int pageSize);
        public Task<Order?> GetByIdWithDetailsAsync(int orderId);
        public Task<(IEnumerable<Order> Orders, int TotalCount)> GetAllWithDetailsAsync(int page, int pageSize);
        public Task<AdminDashboardStatsDto> GetAdminDashboardStatsAsync(int totalUsersCount);
        public Task<(IEnumerable<AdminTransactionDto> Items, int TotalCount)> GetAdminTransactionsAsync(int page, int pageSize);
        public Task<AdminTransactionDetailDto?> GetAdminTransactionByIdAsync(int orderId);
    }
}
