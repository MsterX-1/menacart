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

        public async Task<AdminOrdersPagedResponseDto> GetAllOrdersAsync(int page, int pageSize)
        {
            var (orders, totalCount) = await _unitOfWork.OrderRepository.GetAllWithDetailsAsync(page, pageSize);

            var items = orders.Select(o => new AdminOrderDto
            {
                OrderId = o.OrderId,
                BuyerId = o.UserId,
                BuyerName = o.User != null ? $"{o.User.FirstName} {o.User.LastName}".Trim() : "Unknown",
                BuyerEmail = o.User?.Email ?? "Unknown",
                ShippingAddress = o.Address != null ? $"{o.Address.Street}, {o.Address.City}, {o.Address.Country}" : "",
                TotalAmount = o.TotalAmount,
                PlatformDiscount = o.PlatformDiscount,
                Status = o.Status.ToString(),
                PaymentStatus = o.PaymentStatus.ToString(),
                CreatedAt = o.CreatedAt,
                SubOrders = o.SubOrders.Select(so => new AdminOrderSubOrderDto
                {
                    SubOrderId = so.SubOrderId,
                    SellerId = so.SellerId,
                    StoreName = so.SellerProfile?.StoreName ?? "Unknown Store",
                    Status = so.Status.ToString(),
                    ShippingCost = so.ShippingCost,
                    PlatformCommission = so.OrderItems != null 
                        ? so.OrderItems.SelectMany(oi => oi.SellerCommissions ?? new List<Domain.Models.SellerCommission>()).Sum(c => c.CommissionAmount) 
                        : 0,
                    Carrier = so.Shipping?.Carrier,
                    TrackingNumber = so.Shipping?.TrackingNumber,
                    Items = so.OrderItems != null ? so.OrderItems.Select(oi => new Application.DTOs.OrderDtos.OrderItemDto
                    {
                        OrderItemId = oi.OrderItemId,
                        VariantId = oi.VariantId,
                        ProductId = oi.ProductVariant?.ProductId ?? 0,
                        ProductName = oi.ProductVariant?.Product?.Name ?? "Unknown Product",
                        Color = oi.ProductVariant?.Color,
                        Size = oi.ProductVariant?.Size,
                        Quantity = oi.Quantity,
                        PriceAtPurchase = oi.PriceAtPurchase
                    }).ToList() : new List<Application.DTOs.OrderDtos.OrderItemDto>()
                }).ToList()
            });

            return new AdminOrdersPagedResponseDto
            {
                Items = items,
                PageNumber = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
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
        public async Task<SystemSettingDto?> GetSystemSettingAsync(string key)
        {
            var settings = await _unitOfWork.SystemSettingRepository.GetAll();
            var setting = settings.FirstOrDefault(s => s?.Key == key);
            if (setting == null) return null;
            return new SystemSettingDto { Key = setting.Key, Value = setting.Value };
        }

        public async Task<SystemSettingDto> UpdateSystemSettingAsync(string key, string value)
        {
            var settings = await _unitOfWork.SystemSettingRepository.GetAll();
            var setting = settings.FirstOrDefault(s => s?.Key == key);
            if (setting == null)
            {
                setting = new Domain.Models.SystemSetting { Key = key, Value = value };
                await _unitOfWork.SystemSettingRepository.Add(setting);
            }
            else
            {
                setting.Value = value;
                await _unitOfWork.SystemSettingRepository.Update(setting);
            }
            await _unitOfWork.CompleteAsync();
            return new SystemSettingDto { Key = setting.Key, Value = setting.Value };
        }
    }
}
