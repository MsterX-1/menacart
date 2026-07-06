using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IShippingRepository : IGenaricRepository<Shipping>
    {
        Task<Shipping?> GetBySubOrderIdAsync(int subOrderId);
    }
}