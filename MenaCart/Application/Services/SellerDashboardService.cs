using Application.DTOs.SellerDtos;
using Application.Interfaces.IRepositories;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using System.Threading.Tasks;

namespace Application.Services
{
    public class SellerDashboardService : ISellerDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SellerDashboardService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SellerDashboardStatsDto> GetSellerDashboardStatsAsync(int sellerId)
        {
            return await _unitOfWork.SellerRepository.GetSellerDashboardStatsAsync(sellerId);
        }
    }
}
