using Application.DTOs.ReturnDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class ReturnService : IReturnService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly UserManager<User> _userManager;

        public ReturnService(IUnitOfWork unitOfWork, IConfiguration config, UserManager<User> userManager)
        {
            _unitOfWork = unitOfWork;
            _config = config;
            _userManager = userManager;
        }

        // ══════════════════════════════════════════════════════════════════════
        // CUSTOMER
        // ══════════════════════════════════════════════════════════════════════

        public async Task<ReturnResponseDto> CreateReturnAsync(string userId, CreateReturnRequestDto request)
        {
            // Load order item
            var orderItem = await _unitOfWork.OrderItemRepository.GetById(request.OrderItemId);
            if (orderItem == null)
                throw new KeyNotFoundException("Order item not found.");

            // Load suborder details
            var subOrder = await _unitOfWork.SubOrderRepository.GetByIdWithDetailsAsync(orderItem.SubOrderId);
            if (subOrder == null)
                throw new KeyNotFoundException("SubOrder not found.");

            // Verify ownership
            var order = await _unitOfWork.OrderRepository.GetByIdWithDetailsAsync(subOrder.OrderId);
            if (order == null || order.UserId != userId)
                throw new UnauthorizedAccessException("This order item does not belong to you.");

            // Only allow returns on Delivered suborders
            if (subOrder.Status != SubOrderStatus.Delivered)
                throw new Exception("Returns can only be requested for delivered items.");

            // Verify shipping and return window
            if (subOrder.Shipping == null || !subOrder.Shipping.DeliveredAt.HasValue)
                throw new Exception("Returns can only be requested for delivered items with valid delivery tracking.");

            var windowDays = Convert.ToInt32(_config["Returns:WindowDays"] ?? "14");
            if (subOrder.Shipping.DeliveredAt.Value.AddDays(windowDays) < DateTime.UtcNow)
                throw new Exception("The return window for this item has expired.");

            // Prevent duplicate return/exchange for same order item (must not be active)
            var hasActiveReturn = await _unitOfWork.ReturnRepository.HasActiveReturnForOrderItemAsync(request.OrderItemId);
            if (hasActiveReturn)
                throw new Exception("An active return or exchange request already exists for this item.");

            // Parse return/exchange type
            if (!Enum.TryParse<ReturnType>(request.Type, ignoreCase: true, out var returnType))
                throw new Exception($"Invalid return type '{request.Type}'.");

            // Locate matching item in subOrder to get original variant info
            var originalItem = subOrder.OrderItems.First(oi => oi.OrderItemId == request.OrderItemId);

            // Validate exchange variant if type is Exchange
            if (returnType == ReturnType.Exchange)
            {
                if (!request.ExchangeVariantId.HasValue)
                    throw new Exception("ExchangeVariantId is required for Exchange requests.");

                var exchangeVariant = await _unitOfWork.ProductVariantRepository.GetById(request.ExchangeVariantId.Value);
                if (exchangeVariant == null)
                    throw new KeyNotFoundException("Exchange variant not found.");

                // Must belong to the same ProductId
                if (exchangeVariant.ProductId != originalItem.ProductVariant.ProductId)
                    throw new Exception("Exchange variant must belong to the same product.");

                // Must be in stock
                if (exchangeVariant.StockQuantity <= 0)
                    throw new Exception("Selected exchange variant is out of stock.");
            }

            var ret = new Return
            {
                OrderItemId = request.OrderItemId,
                Type = returnType,
                ExchangeVariantId = returnType == ReturnType.Exchange ? request.ExchangeVariantId : null,
                Reason = request.Reason,
                Status = ReturnStatus.Requested,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReturnRepository.Add(ret);

            // Notify seller
            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = subOrder.SellerProfile.UserId,
                Message = $"A {returnType} request has been submitted for Order #{order.OrderId}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.CompleteAsync();

            var created = await _unitOfWork.ReturnRepository.GetByIdWithDetailsAsync(ret.ReturnId);
            return MapToDto(created!);
        }

        public async Task<IEnumerable<ReturnResponseDto>> GetMyReturnsAsync(
            string userId, int page, int pageSize)
        {
            var returns = await _unitOfWork.ReturnRepository.GetByUserIdAsync(userId, page, pageSize);
            return returns.Select(MapToDto);
        }

        // ══════════════════════════════════════════════════════════════════════
        // SELLER / ADMIN
        // ══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<ReturnResponseDto>> GetSellerReturnsAsync(
            string userId, int page, int pageSize)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var returns = await _unitOfWork.ReturnRepository
                .GetBySellerIdAsync(seller.SellerId, page, pageSize);
            return returns.Select(MapToDto);
        }

        public async Task<ReturnResponseDto> UpdateReturnStatusAsync(
            string userId, int returnId, UpdateReturnStatusRequestDto request)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var isAdmin = user != null && await _userManager.IsInRoleAsync(user, "Admin");

            SellerProfile? seller = null;
            if (!isAdmin)
            {
                seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
                if (seller == null)
                    throw new UnauthorizedAccessException("Seller profile not found.");
            }

            var ret = await _unitOfWork.ReturnRepository.GetByIdWithDetailsAsync(returnId);
            if (ret == null)
                throw new KeyNotFoundException("Return not found.");

            // Ownership — seller must own the order item's suborder
            if (!isAdmin && ret.OrderItem.SubOrder.SellerId != seller.SellerId)
                throw new UnauthorizedAccessException("You do not own this return.");

            if (!Enum.TryParse<ReturnStatus>(request.Status, ignoreCase: true, out var newStatus))
                throw new Exception($"Invalid status '{request.Status}'.");

            // Validate transition
            ValidateTransition(ret.Status, newStatus);

            // Re-verify exchange variant stock at approval time (prevent race condition)
            if (newStatus == ReturnStatus.Approved && ret.Type == ReturnType.Exchange)
            {
                if (!ret.ExchangeVariantId.HasValue)
                    throw new Exception("ExchangeVariantId is missing on exchange request.");

                var exchangeVariant = await _unitOfWork.ProductVariantRepository.GetById(ret.ExchangeVariantId.Value);
                if (exchangeVariant == null)
                    throw new KeyNotFoundException("Exchange variant not found.");

                if (exchangeVariant.StockQuantity < ret.OrderItem.Quantity)
                    throw new Exception("Selected exchange variant has insufficient stock to approve exchange.");

                // Decrement exchange variant stock to reserve it
                exchangeVariant.StockQuantity -= ret.OrderItem.Quantity;
                await _unitOfWork.ProductVariantRepository.Update(exchangeVariant);

                // Reset SubOrder and Shipping to allow shipping replacement
                ret.OrderItem.SubOrder.Status = SubOrderStatus.Processing;
                if (ret.OrderItem.SubOrder.Order != null && ret.OrderItem.SubOrder.Order.Status == OrderStatus.Completed)
                {
                    ret.OrderItem.SubOrder.Order.Status = OrderStatus.Placed;
                    ret.OrderItem.SubOrder.Order.UpdatedAt = DateTime.UtcNow;
                }

                if (ret.OrderItem.SubOrder.Shipping != null)
                {
                    ret.OrderItem.SubOrder.Shipping.Status = ShippingStatus.Pending;
                    ret.OrderItem.SubOrder.Shipping.Carrier = string.Empty;
                    ret.OrderItem.SubOrder.Shipping.TrackingNumber = string.Empty;
                    ret.OrderItem.SubOrder.Shipping.ShippedAt = null;
                    ret.OrderItem.SubOrder.Shipping.DeliveredAt = null;
                    ret.OrderItem.SubOrder.Shipping.UpdatedAt = DateTime.UtcNow;
                }
            }

            ret.Status = newStatus;
            ret.UpdatedAt = DateTime.UtcNow;

            // Set refund amount when approving a Return type
            if (newStatus == ReturnStatus.Approved && ret.Type == ReturnType.Return)
            {
                ret.RefundAmount = request.RefundAmount
                    ?? ret.OrderItem.PriceAtPurchase * ret.OrderItem.Quantity;
            }

            // Side effects on completed return/exchange
            if (newStatus == ReturnStatus.Completed)
            {
                // Restock original item
                var originalVariant = await _unitOfWork.ProductVariantRepository.GetById(ret.OrderItem.VariantId);
                if (originalVariant != null)
                {
                    originalVariant.StockQuantity += ret.OrderItem.Quantity;
                    await _unitOfWork.ProductVariantRepository.Update(originalVariant);
                }

                if (ret.Type == ReturnType.Return)
                {
                    // Refund order and payment
                    ret.OrderItem.SubOrder.Order.PaymentStatus = OrderPaymentStatus.Refunded;
                    var payment = ret.OrderItem.SubOrder.Order.Payments?.FirstOrDefault();
                    if (payment != null)
                    {
                        payment.Status = PaymentStatus.Refunded;
                    }
                }
            }

            // Notify customer
            var buyerUserId = ret.OrderItem.SubOrder.Order.UserId;
            var message = newStatus switch
            {
                ReturnStatus.Approved => ret.Type == ReturnType.Return
                    ? $"Your return request has been approved. Refund of {ret.RefundAmount:C} will be processed."
                    : "Your exchange request has been approved.",
                ReturnStatus.Rejected => $"Your return request was rejected. {request.Note ?? string.Empty}",
                ReturnStatus.Completed => "Your return/exchange has been completed.",
                _ => $"Your return status has been updated to {newStatus}."
            };

            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = buyerUserId,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.ReturnRepository.Update(ret);
            await _unitOfWork.CompleteAsync();

            return MapToDto(ret);
        }

        // ── Transition validation ──────────────────────────────────────────────
        private static readonly Dictionary<ReturnStatus, ReturnStatus[]> _allowedTransitions = new()
        {
            { ReturnStatus.Requested, new[] { ReturnStatus.Approved, ReturnStatus.Rejected } },
            { ReturnStatus.Approved,  new[] { ReturnStatus.Completed } },
            { ReturnStatus.Rejected,  Array.Empty<ReturnStatus>() },
            { ReturnStatus.Completed, Array.Empty<ReturnStatus>() },
        };

        private static void ValidateTransition(ReturnStatus current, ReturnStatus next)
        {
            if (!_allowedTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next))
                throw new Exception($"Invalid transition: {current} → {next}.");
        }

        // ── Mapper ─────────────────────────────────────────────────────────────
        private static ReturnResponseDto MapToDto(Return r) => new()
        {
            ReturnId = r.ReturnId,
            OrderItemId = r.OrderItemId,
            ProductName = r.OrderItem?.ProductVariant?.Product?.Name ?? string.Empty,
            Color = r.OrderItem?.ProductVariant?.Color,
            Size = r.OrderItem?.ProductVariant?.Size,
            Quantity = r.OrderItem?.Quantity ?? 0,
            PriceAtPurchase = r.OrderItem?.PriceAtPurchase ?? 0,
            Type = r.Type.ToString(),
            ExchangeVariantSku = r.ExchangeVariant?.Sku,
            Reason = r.Reason,
            RefundAmount = r.RefundAmount,
            Status = r.Status.ToString(),
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
