using Domain.Models;
using Application.DTOs.SellerDtos;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerRepository : IGenaricRepository<SellerProfile>
    {
        Task<SellerProfile?> GetByUserIdAsync(string userId);
        Task<SellerProfile?> GetByIdWithUserAsync(int sellerId);
        Task<IEnumerable<SellerProfile>> GetAllWithUserAsync(string? statusFilter, int page, int pageSize);
        Task<SellerDashboardStatsDto> GetSellerDashboardStatsAsync(int sellerId);
    }
}