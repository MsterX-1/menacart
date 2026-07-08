using Application.DTOs.CouponDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class CouponService : ICouponService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CouponService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CouponResponseDto> CreateCouponAsync(CreateCouponDto request)
        {
            var existing = await _unitOfWork.CouponRepository.GetByCodeAsync(request.Code);
            if (existing != null)
                throw new InvalidOperationException($"Coupon with code '{request.Code}' already exists.");

            if (!Enum.TryParse<DiscountType>(request.DiscountType, ignoreCase: true, out var type))
                throw new ArgumentException("Invalid discount type.");

            var coupon = new Coupon
            {
                Code = request.Code.ToUpperInvariant(),
                DiscountType = type,
                DiscountValue = request.DiscountValue,
                ExpiryDate = request.ExpiryDate,
                UsageLimit = request.UsageLimit,
                MinOrderAmount = request.MinOrderAmount,
                UsedCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.CouponRepository.Add(coupon);
            await _unitOfWork.CompleteAsync();

            return MapToDto(coupon);
        }

        public async Task<CouponResponseDto> UpdateCouponAsync(int id, CreateCouponDto request)
        {
            var coupon = await _unitOfWork.CouponRepository.GetById(id);
            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with ID {id} not found.");

            if (!Enum.TryParse<DiscountType>(request.DiscountType, ignoreCase: true, out var type))
                throw new ArgumentException("Invalid discount type.");

            // Check code duplication
            var existing = await _unitOfWork.CouponRepository.GetByCodeAsync(request.Code);
            if (existing != null && existing.CouponId != id)
                throw new InvalidOperationException($"Coupon with code '{request.Code}' already exists.");

            coupon.Code = request.Code.ToUpperInvariant();
            coupon.DiscountType = type;
            coupon.DiscountValue = request.DiscountValue;
            coupon.ExpiryDate = request.ExpiryDate;
            coupon.UsageLimit = request.UsageLimit;
            coupon.MinOrderAmount = request.MinOrderAmount;

            await _unitOfWork.CouponRepository.Update(coupon);
            await _unitOfWork.CompleteAsync();

            return MapToDto(coupon);
        }

        public async Task DeleteCouponAsync(int id)
        {
            var coupon = await _unitOfWork.CouponRepository.GetById(id);
            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with ID {id} not found.");

            await _unitOfWork.CouponRepository.Delete(id);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<IEnumerable<CouponResponseDto>> GetAllCouponsAsync()
        {
            var coupons = await _unitOfWork.CouponRepository.GetAll();
            return coupons.Select(c => MapToDto(c));
        }

        public async Task<CouponResponseDto> GetCouponByCodeAsync(string code)
        {
            var coupon = await _unitOfWork.CouponRepository.GetByCodeAsync(code);
            if (coupon == null)
                throw new KeyNotFoundException($"Coupon with code '{code}' not found.");

            return MapToDto(coupon);
        }

        // ── Helper Mapper ──────────────────────────────────────────────────────
        private static CouponResponseDto MapToDto(Coupon c) => new()
        {
            CouponId = c.CouponId,
            Code = c.Code,
            DiscountType = c.DiscountType.ToString(),
            DiscountValue = c.DiscountValue,
            ExpiryDate = c.ExpiryDate,
            UsageLimit = c.UsageLimit,
            UsedCount = c.UsedCount,
            MinOrderAmount = c.MinOrderAmount
        };
    }
}
