using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerPayoutRepository : IGenaricRepository<SellerPayout>
    {
        Task<IEnumerable<SellerPayout>> GetBySellerIdAsync(int sellerId);
        Task<IEnumerable<SellerPayout>> GetAllPayoutsAsync(string? statusFilter);
    }
}
