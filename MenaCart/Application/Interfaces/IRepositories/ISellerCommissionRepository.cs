using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerCommissionRepository : IGenaricRepository<SellerCommission>
    {
        Task<IEnumerable<SellerCommission>> GetBySubOrderIdAsync(int subOrderId);
        Task<IEnumerable<SellerCommission>> GetSettledCommissionsBySellerIdAsync(int sellerId);
        Task<IEnumerable<SellerCommission>> GetCommissionsByPayoutIdAsync(int payoutId);
    }
}
