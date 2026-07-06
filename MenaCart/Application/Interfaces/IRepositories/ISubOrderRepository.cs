using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface ISubOrderRepository : IGenaricRepository<SubOrder>
    {
        Task<SubOrder?> GetByIdWithDetailsAsync(int subOrderId);
        Task<IEnumerable<SubOrder>> GetBySellerIdAsync(int sellerId, string? statusFilter, int page, int pageSize);
    }
}