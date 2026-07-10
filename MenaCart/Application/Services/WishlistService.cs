using Application.DTOs.WishlistDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class WishlistService : IWishlistService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WishlistService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<WishlistResponseDto>> GetWishlistAsync(string userId)
        {
            var list = await _unitOfWork.WishlistRepository.GetByUserIdAsync(userId);
            return list.Select(w => new WishlistResponseDto
            {
                WishlistId = w.WishlistId,
                VariantId = w.VariantId,
                ProductId = w.ProductVariant.ProductId,
                ProductName = w.ProductVariant.Product.Name,
                Sku = w.ProductVariant.Sku,
                Price = w.ProductVariant.Price,
                StockQuantity = w.ProductVariant.StockQuantity,
                MainImageUrl = !string.IsNullOrEmpty(w.ProductVariant.MainImageUrl) 
                    ? w.ProductVariant.MainImageUrl 
                    : w.ProductVariant.Product.MainImageUrl,
                AddedAt = w.AddedAt
            }).ToList();
        }

        public async Task AddToWishlistAsync(string userId, AddToWishlistRequestDto dto)
        {
            var variant = await _unitOfWork.ProductVariantRepository.GetById(dto.VariantId);
            if (variant == null)
            {
                throw new Exception("Product variant not found.");
            }

            var existing = await _unitOfWork.WishlistRepository.GetByUserAndVariantAsync(userId, dto.VariantId);
            if (existing != null)
            {
                return; // Already in wishlist
            }

            var wishlistEntry = new Wishlist
            {
                UserId = userId,
                VariantId = dto.VariantId,
                AddedAt = DateTime.UtcNow
            };

            await _unitOfWork.WishlistRepository.Add(wishlistEntry);
            await _unitOfWork.CompleteAsync();
        }

        public async Task RemoveFromWishlistAsync(string userId, int variantId)
        {
            var existing = await _unitOfWork.WishlistRepository.GetByUserAndVariantAsync(userId, variantId);
            if (existing == null)
            {
                return;
            }

            await _unitOfWork.WishlistRepository.Delete(existing.WishlistId);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<bool> IsInWishlistAsync(string userId, int variantId)
        {
            var existing = await _unitOfWork.WishlistRepository.GetByUserAndVariantAsync(userId, variantId);
            return existing != null;
        }
    }
}
