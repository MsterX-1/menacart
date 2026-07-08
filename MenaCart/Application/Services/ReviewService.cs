using Application.DTOs.ReviewDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReviewService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ReviewResponseDto> SubmitProductReviewAsync(string userId, CreateReviewDto request)
        {
            // 1. Verify buyer purchase in completed suborder
            var purchased = await _unitOfWork.ReviewRepository.HasUserPurchasedProductAsync(userId, request.ProductId);
            if (!purchased)
                throw new InvalidOperationException("You can only review products you have purchased in a completed order.");

            // 2. Check for existing review (unique user+product review constraint check)
            var alreadyReviewed = await _unitOfWork.ReviewRepository.HasUserReviewedProductAsync(userId, request.ProductId);
            if (alreadyReviewed)
                throw new InvalidOperationException("You have already reviewed this product.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var review = new Review
                {
                    UserId = userId,
                    ProductId = request.ProductId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.ReviewRepository.Add(review);
                await _unitOfWork.CompleteAsync();

                // 3. Transactionally recompute product rating statistics
                var avgRating = await _unitOfWork.ReviewRepository.GetAverageRatingForProductAsync(request.ProductId);
                var reviewCount = await _unitOfWork.ReviewRepository.GetReviewCountForProductAsync(request.ProductId);

                var product = await _unitOfWork.ProductRepository.GetById(request.ProductId);
                if (product != null)
                {
                    product.AverageRating = avgRating;
                    product.ReviewCount = reviewCount;
                    await _unitOfWork.ProductRepository.Update(product);
                    await _unitOfWork.CompleteAsync();
                }

                await _unitOfWork.CommitTransactionAsync();

                // Fetch review with details for response
                var detailedReviews = await _unitOfWork.ReviewRepository.GetByProductIdAsync(request.ProductId, 1, 1000);
                var savedReview = detailedReviews.First(r => r.UserId == userId);
                return MapToProductReviewDto(savedReview);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IEnumerable<ReviewResponseDto>> GetProductReviewsAsync(int productId, int page, int pageSize)
        {
            var reviews = await _unitOfWork.ReviewRepository.GetByProductIdAsync(productId, page, pageSize);
            return reviews.Select(MapToProductReviewDto);
        }

        public async Task<SellerReviewResponseDto> SubmitSellerReviewAsync(string userId, CreateSellerReviewDto request)
        {
            // 1. Verify buyer has completed suborder from seller
            var purchased = await _unitOfWork.SellerReviewRepository.HasUserPurchasedFromSellerAsync(userId, request.SellerId);
            if (!purchased)
                throw new InvalidOperationException("You can only review sellers you have purchased from in a completed order.");

            // 2. Check for existing review (unique customer+seller constraint check)
            var alreadyReviewed = await _unitOfWork.SellerReviewRepository.HasUserReviewedSellerAsync(userId, request.SellerId);
            if (alreadyReviewed)
                throw new InvalidOperationException("You have already reviewed this seller.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var sellerReview = new SellerReview
                {
                    CustomerId = userId,
                    SellerId = request.SellerId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.SellerReviewRepository.Add(sellerReview);
                await _unitOfWork.CompleteAsync();

                // 3. Transactionally recompute seller rating
                var avgRating = await _unitOfWork.SellerReviewRepository.GetAverageRatingForSellerAsync(request.SellerId);
                
                var seller = await _unitOfWork.SellerRepository.GetById(request.SellerId);
                if (seller != null)
                {
                    seller.Rating = avgRating;
                    await _unitOfWork.SellerRepository.Update(seller);
                    await _unitOfWork.CompleteAsync();
                }

                await _unitOfWork.CommitTransactionAsync();

                var detailedReviews = await _unitOfWork.SellerReviewRepository.GetBySellerIdAsync(request.SellerId, 1, 1000);
                var savedReview = detailedReviews.First(sr => sr.CustomerId == userId);
                return MapToSellerReviewDto(savedReview);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IEnumerable<SellerReviewResponseDto>> GetSellerReviewsAsync(int sellerId, int page, int pageSize)
        {
            var reviews = await _unitOfWork.SellerReviewRepository.GetBySellerIdAsync(sellerId, page, pageSize);
            return reviews.Select(MapToSellerReviewDto);
        }

        // ── Mappers ────────────────────────────────────────────────────────────
        private static ReviewResponseDto MapToProductReviewDto(Review r) => new()
        {
            ReviewId = r.ReviewId,
            UserId = r.UserId,
            UserName = r.User?.UserName ?? "Anonymous",
            ProductId = r.ProductId,
            Rating = r.Rating,
            Comment = r.Comment ?? string.Empty,
            CreatedAt = r.CreatedAt
        };

        private static SellerReviewResponseDto MapToSellerReviewDto(SellerReview sr) => new()
        {
            SellerReviewId = sr.SellerReviewId,
            SellerId = sr.SellerId,
            CustomerId = sr.CustomerId,
            CustomerName = sr.Customer?.UserName ?? "Anonymous",
            Rating = sr.Rating,
            Comment = sr.Comment ?? string.Empty,
            CreatedAt = sr.CreatedAt
        };
    }
}
