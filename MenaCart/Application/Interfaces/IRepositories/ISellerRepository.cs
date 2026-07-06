using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerRepository : IGenaricRepository<SellerProfile>
    {
        Task<SellerProfile?> GetByUserIdAsync(string userId);
    }
}