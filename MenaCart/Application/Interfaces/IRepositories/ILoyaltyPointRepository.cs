using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ILoyaltyPointRepository : IGenaricRepository<LoyaltyPoint>
    {
        Task<int> GetBalanceByUserIdAsync(string userId);
        Task<IEnumerable<LoyaltyPoint>> GetLedgerByUserIdAsync(string userId);
    }
}
