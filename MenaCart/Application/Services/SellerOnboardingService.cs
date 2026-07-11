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
        private readonly Microsoft.AspNetCore.Identity.UserManager<User> _userManager;

        public SellerOnboardingService(IUnitOfWork unitOfWork, Microsoft.AspNetCore.Identity.UserManager<User> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        public async Task<SellerProfileResponseDto> BecomeInstantSellerAsync(string userId, string defaultStoreName)
        {
            var profile = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);

            if (profile != null)
            {
                profile.Status = SellerStatus.Active;
                profile.IsVerified = true;
                profile.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.SellerRepository.Update(profile);
            }
            else
            {
                profile = new SellerProfile
                {
                    UserId = userId,
                    StoreName = defaultStoreName,
                    StoreDescription = "A new seller store",
                    StoreLogoUrl = string.Empty,
                    StoreBannerUrl = string.Empty,
                    StoreAddress = string.Empty,
                    Phone = string.Empty,
                    Status = SellerStatus.Active,
                    IsVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _unitOfWork.SellerRepository.Add(profile);
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                await _userManager.AddToRoleAsync(user, "Seller");
            }

            await _unitOfWork.CompleteAsync();
            return MapToDto(profile);
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
                profile.StripeAccountId = request.StripeAccountId;
                profile.BaseShippingCost = request.BaseShippingCost;
                profile.FreeShippingThreshold = request.FreeShippingThreshold;
                profile.Status = SellerStatus.Pending;
                profile.RejectionReason = null;
                profile.ReturnPolicyDays = request.ReturnPolicyDays ?? 14;
                profile.UpdatedAt = DateTime.UtcNow;

                var bankInfo = profile.SellerBankInfos?.FirstOrDefault();
                if (bankInfo == null && !string.IsNullOrWhiteSpace(request.BankName))
                {
                    if (profile.SellerBankInfos == null) profile.SellerBankInfos = new List<SellerBankInfo>();
                    profile.SellerBankInfos.Add(new SellerBankInfo
                    {
                        BankName = request.BankName,
                        AccountNumber = request.AccountNumber ?? "",
                        AccountHolder = request.AccountHolder ?? "",
                        Iban = request.Iban ?? ""
                    });
                }
                else if (bankInfo != null)
                {
                    bankInfo.BankName = request.BankName ?? bankInfo.BankName;
                    bankInfo.AccountNumber = request.AccountNumber ?? bankInfo.AccountNumber;
                    bankInfo.AccountHolder = request.AccountHolder ?? bankInfo.AccountHolder;
                    bankInfo.Iban = request.Iban ?? bankInfo.Iban;
                }

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
                    StripeAccountId = request.StripeAccountId,
                    BaseShippingCost = request.BaseShippingCost,
                    FreeShippingThreshold = request.FreeShippingThreshold,
                    ReturnPolicyDays = request.ReturnPolicyDays ?? 14,
                    Status = SellerStatus.Pending,
                    IsVerified = false,
                    Rating = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    SellerBankInfos = !string.IsNullOrWhiteSpace(request.BankName) ? new List<SellerBankInfo>
                    {
                        new SellerBankInfo
                        {
                            BankName = request.BankName,
                            AccountNumber = request.AccountNumber ?? "",
                            AccountHolder = request.AccountHolder ?? "",
                            Iban = request.Iban ?? ""
                        }
                    } : new List<SellerBankInfo>()
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
            profile.StripeAccountId = request.StripeAccountId;
            profile.BaseShippingCost = request.BaseShippingCost;
            profile.FreeShippingThreshold = request.FreeShippingThreshold;
            
            if (request.DeliveryProviders != null)
            {
                profile.DeliveryProviders = request.DeliveryProviders;
            }

            profile.ReturnPolicyDays = request.ReturnPolicyDays ?? profile.ReturnPolicyDays;
            profile.UpdatedAt = DateTime.UtcNow;

            var bankInfo = profile.SellerBankInfos?.FirstOrDefault();
            if (bankInfo == null && !string.IsNullOrWhiteSpace(request.BankName))
            {
                if (profile.SellerBankInfos == null) profile.SellerBankInfos = new List<SellerBankInfo>();
                profile.SellerBankInfos.Add(new SellerBankInfo
                {
                    BankName = request.BankName,
                    AccountNumber = request.AccountNumber ?? "",
                    AccountHolder = request.AccountHolder ?? "",
                    Iban = request.Iban ?? ""
                });
            }
            else if (bankInfo != null)
            {
                bankInfo.BankName = request.BankName ?? bankInfo.BankName;
                bankInfo.AccountNumber = request.AccountNumber ?? bankInfo.AccountNumber;
                bankInfo.AccountHolder = request.AccountHolder ?? bankInfo.AccountHolder;
                bankInfo.Iban = request.Iban ?? bankInfo.Iban;
            }

            await _unitOfWork.SellerRepository.Update(profile);
            await _unitOfWork.CompleteAsync();

            return MapToDto(profile);
        }

        public async Task<PublicSellerListResponseDto> GetActiveSellersAsync(string? search, int page, int pageSize)
        {
            var result = await _unitOfWork.SellerRepository.GetActiveSellersAsync(search, page, pageSize);
            
            var items = result.Items.Select(p => new PublicSellerProfileDto
            {
                SellerId = p.SellerId,
                StoreName = p.StoreName,
                StoreDescription = p.StoreDescription ?? string.Empty,
                StoreLogoUrl = p.StoreLogoUrl ?? string.Empty,
                StoreBannerUrl = p.StoreBannerUrl ?? string.Empty,
                Rating = p.Rating,
                IsVerified = p.IsVerified,
                CreatedAt = p.CreatedAt
            }).ToList();

            return new PublicSellerListResponseDto
            {
                Items = items,
                TotalCount = result.TotalCount,
                CurrentPage = page,
                TotalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize)
            };
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
            StripeAccountId = p.StripeAccountId,
            CommissionRate = p.CommissionRate,
            BaseShippingCost = p.BaseShippingCost,
            FreeShippingThreshold = p.FreeShippingThreshold,
            DeliveryProviders = p.DeliveryProviders,
            ReturnPolicyDays = p.ReturnPolicyDays,
            BankName = p.SellerBankInfos?.FirstOrDefault()?.BankName,
            AccountNumber = p.SellerBankInfos?.FirstOrDefault()?.AccountNumber,
            AccountHolder = p.SellerBankInfos?.FirstOrDefault()?.AccountHolder,
            Iban = p.SellerBankInfos?.FirstOrDefault()?.Iban,
            CreatedAt = p.CreatedAt
        };
    }
}
