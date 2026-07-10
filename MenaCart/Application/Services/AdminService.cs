using Application.DTOs.UserDtos.AdminDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<User> _userManager;

        public AdminService(IUnitOfWork unitOfWork, UserManager<User> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        // ══════════════════════════════════════════════════════════════════════
        // SELLER MANAGEMENT
        // ══════════════════════════════════════════════════════════════════════

        public async Task<AdminSellersPagedResponseDto> GetAllSellersAsync(
            string? status, int page, int pageSize)
        {
            var (sellers, totalCount) = await _unitOfWork.SellerRepository
                .GetAllWithUserAsync(status, page, pageSize);

            var items = sellers.Select(MapSellerToDto).ToList();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new AdminSellersPagedResponseDto
            {
                Items = items,
                PageNumber = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<SellerResponseDto> UpdateSellerStatusAsync(
            int sellerId, UpdateSellerStatusDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByIdWithUserAsync(sellerId);
            if (seller == null)
                throw new KeyNotFoundException("Seller not found.");

            if (!Enum.TryParse<SellerStatus>(request.Status, out var newStatus))
                throw new Exception($"Invalid status '{request.Status}'.");

            var previousStatus = seller.Status;
            seller.Status = newStatus;
            seller.UpdatedAt = DateTime.UtcNow;

            if (newStatus == SellerStatus.Active)
            {
                seller.IsVerified = true;
                seller.RejectionReason = null;
                if (seller.User != null)
                {
                    await _userManager.AddToRoleAsync(seller.User, "Seller");
                }
            }
            else if (newStatus == SellerStatus.Rejected || newStatus == SellerStatus.Suspended)
            {
                seller.RejectionReason = request.Reason;
            }

            // Notify seller
            var message = newStatus switch
            {
                SellerStatus.Active => "Your seller account has been approved. You can now list products.",
                SellerStatus.Suspended => $"Your seller account has been suspended. Reason: {request.Reason ?? "Policy violation."}",
                SellerStatus.Rejected => $"Your seller application has been rejected. Reason: {request.Reason ?? "Not specified."}",
                _ => $"Your seller account status has been updated to {newStatus}."
            };

            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = seller.UserId,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.SellerRepository.Update(seller);
            await _unitOfWork.CompleteAsync();

            return MapSellerToDto(seller);
        }

        public async Task BanSellerEmailAsync(int sellerId, BanSellerEmailDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByIdWithUserAsync(sellerId);
            if (seller == null)
                throw new KeyNotFoundException("Seller not found.");

            var user = seller.User;
            if (user == null)
                throw new Exception("Seller user account not found.");

            // Lock out the account permanently
            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

            // Suspend the seller profile
            seller.Status = SellerStatus.Suspended;
            seller.UpdatedAt = DateTime.UtcNow;

            // Notify seller
            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = seller.UserId,
                Message = $"Your account has been banned. Reason: {request.Reason}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.SellerRepository.Update(seller);
            await _unitOfWork.CompleteAsync();
        }

        public async Task SendWarningAsync(int sellerId, SendWarningDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByIdWithUserAsync(sellerId);
            if (seller == null)
                throw new KeyNotFoundException("Seller not found.");

            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = seller.UserId,
                Message = $"⚠️ Warning from Admin: {request.Message}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.CompleteAsync();
        }

        public async Task UpdateSellerCommissionAsync(int sellerId, decimal? commissionRate)
        {
            var seller = await _unitOfWork.SellerRepository.GetByIdWithUserAsync(sellerId);
            if (seller == null)
                throw new KeyNotFoundException("Seller not found.");

            seller.CommissionRate = commissionRate;
            seller.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SellerRepository.Update(seller);
            await _unitOfWork.CompleteAsync();
        }

        // ══════════════════════════════════════════════════════════════════════
        // COUPONS
        // ══════════════════════════════════════════════════════════════════════

        public async Task<CouponResponseDto> CreateCouponAsync(CreateCouponDto request)
        {
            // Check for duplicate code
            var existing = await _unitOfWork.CouponRepository.GetByCodeAsync(request.Code);
            if (existing != null)
                throw new Exception($"Coupon code '{request.Code}' already exists.");

            if (request.ExpiryDate <= DateTime.UtcNow)
                throw new Exception("Expiry date must be in the future.");

            if (!Enum.TryParse<DiscountType>(request.DiscountType, out var discountType))
                throw new Exception($"Invalid discount type '{request.DiscountType}'.");

            if (discountType == DiscountType.Percentage && request.DiscountValue > 100)
                throw new Exception("Percentage discount cannot exceed 100.");

            var coupon = new Coupon
            {
                Code = request.Code.ToUpperInvariant(),
                DiscountType = discountType,
                DiscountValue = request.DiscountValue,
                MinOrderAmount = request.MinOrderAmount,
                ExpiryDate = request.ExpiryDate,
                UsageLimit = request.UsageLimit,
                UsedCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.CouponRepository.Add(coupon);
            await _unitOfWork.CompleteAsync();

            return MapCouponToDto(coupon);
        }

        public async Task<IEnumerable<CouponResponseDto>> GetAllCouponsAsync()
        {
            var coupons = await _unitOfWork.CouponRepository.GetAll();
            return coupons
                .Where(c => c != null)
                .Select(c => MapCouponToDto(c!));
        }

        public async Task DeleteCouponAsync(int couponId)
        {
            var coupon = await _unitOfWork.CouponRepository.GetById(couponId);
            if (coupon == null)
                throw new KeyNotFoundException("Coupon not found.");

            await _unitOfWork.CouponRepository.Delete(couponId);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
        {
            var totalUsersCount = await _userManager.Users.CountAsync();
            return await _unitOfWork.OrderRepository.GetAdminDashboardStatsAsync(totalUsersCount);
        }

        // ── Mappers ────────────────────────────────────────────────────────────

        private static SellerResponseDto MapSellerToDto(SellerProfile s) => new()
        {
            SellerId = s.SellerId,
            UserId = s.UserId,
            StoreName = s.StoreName,
            Email = s.User?.Email ?? string.Empty,
            Status = s.Status.ToString(),
            IsVerified = s.IsVerified,
            CommissionRate = s.CommissionRate,
            CreatedAt = s.CreatedAt
        };

        private static CouponResponseDto MapCouponToDto(Coupon c) => new()
        {
            CouponId = c.CouponId,
            Code = c.Code,
            DiscountType = c.DiscountType.ToString(),
            DiscountValue = c.DiscountValue,
            MinOrderAmount = c.MinOrderAmount,
            ExpiryDate = c.ExpiryDate,
            UsageLimit = c.UsageLimit,
            UsedCount = c.UsedCount,
            CreatedAt = c.CreatedAt
        };

        public async Task<AdminTransactionsPagedResponseDto> GetTransactionsAsync(int page, int pageSize)
        {
            var (transactions, totalCount) = await _unitOfWork.OrderRepository.GetAdminTransactionsAsync(page, pageSize);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new AdminTransactionsPagedResponseDto
            {
                Items = transactions,
                PageNumber = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }
        public async Task<AdminTransactionDetailDto?> GetTransactionDetailsAsync(int orderId)
        {
            return await _unitOfWork.OrderRepository.GetAdminTransactionByIdAsync(orderId);
        }
    }
}
