using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerReviewRepository : IGenaricRepository<SellerReview>
    {
        Task<IEnumerable<SellerReview>> GetBySellerIdAsync(int sellerId, int page, int pageSize);
        Task<bool> HasUserPurchasedFromSellerAsync(string userId, int sellerId);
        Task<bool> HasUserReviewedSellerAsync(string userId, int sellerId);
        Task<decimal> GetAverageRatingForSellerAsync(int sellerId);
    }
}
