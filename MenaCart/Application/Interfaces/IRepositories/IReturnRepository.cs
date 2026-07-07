using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IReturnRepository : IGenaricRepository<Return>
    {
        Task<Return?> GetByIdWithDetailsAsync(int returnId);

        /// <summary>Returns for a specific buyer (via OrderItem → SubOrder → Order → UserId).</summary>
        Task<IEnumerable<Return>> GetByUserIdAsync(string userId, int page, int pageSize);

        /// <summary>Returns for a specific seller (via OrderItem → SubOrder → SellerId).</summary>
        Task<IEnumerable<Return>> GetBySellerIdAsync(int sellerId, int page, int pageSize);

        Task<bool> HasActiveReturnForOrderItemAsync(int orderItemId);
    }
}
