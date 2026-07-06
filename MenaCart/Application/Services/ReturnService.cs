using Application.DTOs.ReturnDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;

namespace Application.Services
{
    public class ReturnService : IReturnService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReturnService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ══════════════════════════════════════════════════════════════════════
        // CUSTOMER
        // ══════════════════════════════════════════════════════════════════════

        public async Task<ReturnResponseDto> CreateReturnAsync(string userId, CreateReturnRequestDto request)
        {
            // Load order item with full chain
            var orderItem = await _unitOfWork.OrderItemRepository.GetById(request.OrderItemId);
            if (orderItem == null)
                throw new KeyNotFoundException("Order item not found.");

            // Load full details to verify ownership
            var returnCheck = await _unitOfWork.ReturnRepository
                .GetByUserIdAsync(userId, 1, int.MaxValue);

            // Verify the order item belongs to the user via SubOrder → Order
            var subOrder = await _unitOfWork.SubOrderRepository.GetByIdWithDetailsAsync(
                ((OrderItem)orderItem).SubOrderId);

            if (subOrder == null)
                throw new KeyNotFoundException("SubOrder not found.");

            var order = await _unitOfWork.OrderRepository.GetByIdWithDetailsAsync(subOrder.OrderId);
            if (order == null || order.UserId != userId)
                throw new UnauthorizedAccessException("This order item does not belong to you.");

            // Only allow returns on Delivered suborders
            if (subOrder.Status != SubOrderStatus.Delivered)
                throw new Exception("Returns can only be requested for delivered items.");

            // Prevent duplicate return for same order item
            var existingReturn = await _unitOfWork.ReturnRepository.GetByUserIdAsync(userId, 1, int.MaxValue);
            if (existingReturn.Any(r => r.OrderItemId == request.OrderItemId
                && r.Status != ReturnStatus.Rejected))
                throw new Exception("A return request already exists for this item.");

            // Parse type
            if (!Enum.TryParse<ReturnType>(request.Type, out var returnType))
                throw new Exception($"Invalid return type '{request.Type}'.");

            // Validate exchange variant if type is Exchange
            if (returnType == ReturnType.Exchange)
            {
                if (!request.ExchangeVariantId.HasValue)
                    throw new Exception("ExchangeVariantId is required for Exchange requests.");

                var exchangeVariant = await _unitOfWork.ProductVariantRepository
                    .GetById(request.ExchangeVariantId.Value);
                if (exchangeVariant == null)
                    throw new KeyNotFoundException("Exchange variant not found.");
            }

            var ret = new Return
            {
                OrderItemId = request.OrderItemId,
                Type = returnType,
                ExchangeVariantId = returnType == ReturnType.Exchange
                    ? request.ExchangeVariantId : null,
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
        // SELLER
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
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var ret = await _unitOfWork.ReturnRepository.GetByIdWithDetailsAsync(returnId);
            if (ret == null)
                throw new KeyNotFoundException("Return not found.");

            // Ownership — seller must own the order item's suborder
            if (ret.OrderItem.SubOrder.SellerId != seller.SellerId)
                throw new UnauthorizedAccessException("You do not own this return.");

            if (!Enum.TryParse<ReturnStatus>(request.Status, out var newStatus))
                throw new Exception($"Invalid status '{request.Status}'.");

            // Validate transition
            ValidateTransition(ret.Status, newStatus);

            ret.Status = newStatus;
            ret.UpdatedAt = DateTime.UtcNow;

            // Set refund amount when approving a Return type
            if (newStatus == ReturnStatus.Approved
                && ret.Type == ReturnType.Return)
            {
                ret.RefundAmount = request.RefundAmount
                    ?? ret.OrderItem.PriceAtPurchase * ret.OrderItem.Quantity;
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
