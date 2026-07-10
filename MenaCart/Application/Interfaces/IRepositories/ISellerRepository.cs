using Domain.Models;
using Application.DTOs.SellerDtos;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerRepository : IGenaricRepository<SellerProfile>
    {
        Task<SellerProfile?> GetByUserIdAsync(string userId);
        Task<SellerProfile?> GetByIdWithUserAsync(int sellerId);
        Task<(IEnumerable<SellerProfile> Items, int TotalCount)> GetAllWithUserAsync(string? statusFilter, int page, int pageSize);
        Task<SellerDashboardStatsDto> GetSellerDashboardStatsAsync(int sellerId);
        Task<(IEnumerable<SellerProfile> Items, int TotalCount)> GetActiveSellersAsync(string? search, int page, int pageSize);
    }
}