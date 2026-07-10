using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerShippingRuleRepository : IGenaricRepository<SellerShippingRule>
    {
        Task<IEnumerable<SellerShippingRule>> GetBySellerIdAsync(int sellerId);
        Task<SellerShippingRule?> GetRuleAsync(int sellerId, string city, string country);
    }
}
