using Application.DTOs.SellerDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Services
{
    public class SellerOnboardingService : ISellerOnboardingService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SellerOnboardingService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SellerProfileResponseDto> ApplyAsync(string userId, ApplySellerDto request)
        {
            var profile = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);

            if (profile != null)
            {
                // Can only re-apply if currently Rejected
                if (profile.Status != SellerStatus.Rejected)
                {
                    throw new InvalidOperationException($"Cannot apply. Your current seller profile status is: {profile.Status}");
                }

                // Update existing profile for re-application
                profile.StoreName = request.StoreName;
                profile.StoreDescription = request.StoreDescription;
                profile.StoreLogoUrl = request.StoreLogoUrl;
                profile.StoreBannerUrl = request.StoreBannerUrl;
                profile.StoreAddress = request.StoreAddress;
                profile.Phone = request.Phone;
                profile.Status = SellerStatus.Pending;
                profile.RejectionReason = null;
                profile.UpdatedAt = DateTime.UtcNow;

                await _unitOfWork.SellerRepository.Update(profile);
            }
            else
            {
                // Create brand new application
                profile = new SellerProfile
                {
                    UserId = userId,
                    StoreName = request.StoreName,
                    StoreDescription = request.StoreDescription,
                    StoreLogoUrl = request.StoreLogoUrl,
                    StoreBannerUrl = request.StoreBannerUrl,
                    StoreAddress = request.StoreAddress,
                    Phone = request.Phone,
                    Status = SellerStatus.Pending,
                    IsVerified = false,
                    Rating = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.SellerRepository.Add(profile);
            }

            await _unitOfWork.CompleteAsync();

            return MapToDto(profile);
        }

        public async Task<SellerProfileResponseDto> GetProfileAsync(string userId)
        {
            var profile = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (profile == null)
                throw new KeyNotFoundException("Seller profile not found for this user.");

            return MapToDto(profile);
        }

        public async Task<SellerProfileResponseDto> GetProfileByIdAsync(int sellerId)
        {
            var profile = await _unitOfWork.SellerRepository.GetById(sellerId);
            if (profile == null)
                throw new KeyNotFoundException($"Seller profile with ID {sellerId} not found.");

            return MapToDto(profile);
        }

        public async Task<SellerProfileResponseDto> UpdateProfileAsync(string userId, ApplySellerDto request)
        {
            var profile = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (profile == null)
                throw new KeyNotFoundException("Seller profile not found.");

            profile.StoreName = request.StoreName;
            profile.StoreDescription = request.StoreDescription;
            profile.StoreLogoUrl = request.StoreLogoUrl;
            profile.StoreBannerUrl = request.StoreBannerUrl;
            profile.StoreAddress = request.StoreAddress;
            profile.Phone = request.Phone;
            profile.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SellerRepository.Update(profile);
            await _unitOfWork.CompleteAsync();

            return MapToDto(profile);
        }

        // ── Helper Mapper ──────────────────────────────────────────────────────
        private static SellerProfileResponseDto MapToDto(SellerProfile p) => new()
        {
            SellerId = p.SellerId,
            UserId = p.UserId,
            StoreName = p.StoreName,
            StoreDescription = p.StoreDescription ?? string.Empty,
            StoreLogoUrl = p.StoreLogoUrl ?? string.Empty,
            StoreBannerUrl = p.StoreBannerUrl ?? string.Empty,
            StoreAddress = p.StoreAddress ?? string.Empty,
            Phone = p.Phone ?? string.Empty,
            Rating = p.Rating,
            IsVerified = p.IsVerified,
            Status = p.Status.ToString(),
            RejectionReason = p.RejectionReason,
            CreatedAt = p.CreatedAt
        };
    }
}
