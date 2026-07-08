using Application.DTOs.ReviewDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IReviewService
    {
        Task<ReviewResponseDto> SubmitProductReviewAsync(string userId, CreateReviewDto request);
        Task<IEnumerable<ReviewResponseDto>> GetProductReviewsAsync(int productId, int page, int pageSize);
        Task<SellerReviewResponseDto> SubmitSellerReviewAsync(string userId, CreateSellerReviewDto request);
        Task<IEnumerable<SellerReviewResponseDto>> GetSellerReviewsAsync(int sellerId, int page, int pageSize);
    }
}
