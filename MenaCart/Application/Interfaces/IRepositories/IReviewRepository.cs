using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface IReviewRepository : IGenaricRepository<Review>
    {
        Task<IEnumerable<Review>> GetByProductIdAsync(int productId, int page, int pageSize);
        Task<bool> HasUserPurchasedProductAsync(string userId, int productId);
        Task<bool> HasUserReviewedProductAsync(string userId, int productId);
        Task<decimal> GetAverageRatingForProductAsync(int productId);
        Task<int> GetReviewCountForProductAsync(int productId);
    }
}
