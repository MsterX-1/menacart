using Application.DTOs.SellerDtos;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ISellerDashboardService
    {
        Task<SellerDashboardStatsDto> GetSellerDashboardStatsAsync(int sellerId);
    }
}
