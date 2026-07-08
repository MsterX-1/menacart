using Application.DTOs.LoyaltyDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class LoyaltyService : ILoyaltyService
    {
        private readonly IUnitOfWork _unitOfWork;

        public LoyaltyService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoyaltyResponseDto> GetLoyaltyDetailsAsync(string userId)
        {
            var balance = await _unitOfWork.LoyaltyPointRepository.GetBalanceByUserIdAsync(userId);
            var ledger = await _unitOfWork.LoyaltyPointRepository.GetLedgerByUserIdAsync(userId);

            return new LoyaltyResponseDto
            {
                Balance = balance,
                Ledger = ledger.Select(l => new LoyaltyLedgerEntryDto
                {
                    PointsId = l.PointsId,
                    Points = l.Points,
                    Reason = l.Reason ?? string.Empty,
                    CreatedAt = l.CreatedAt
                }).ToList()
            };
        }
    }
}
