using Application.DTOs.OrderDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;

        public OrderService(IUnitOfWork unitOfWork, IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _config = config;
        }

        // ══════════════════════════════════════════════════════════════════════
        // BUYER
        // ══════════════════════════════════════════════════════════════════════

        public async Task<OrderConfirmationResponseDto> PlaceOrderAsync(string userId, CreateOrderRequestDto request)
        {
            // ── 1. Load cart ───────────────────────────────────────────────────
            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);

            if (cart == null || !cart.CartItems.Any())
                throw new Exception("Your cart is empty.");

            // ── 2. Resolve address ─────────────────────────────────────────────
            Address? address;

            if (request.AddressId.HasValue)
            {
                address = await _unitOfWork.AddressRepository
                    .GetByIdAndUserIdAsync(request.AddressId.Value, userId);

                if (address == null)
                    throw new UnauthorizedAccessException("Address not found or does not belong to you.");
            }
            else
            {
                address = await _unitOfWork.AddressRepository.GetDefaultByUserIdAsync(userId);

                if (address == null)
                    throw new Exception("No default address found. Please add an address to your account.");
            }

            // ── 3. Filter inactive sellers / unapproved products ───────────────
            var activeItems = cart.CartItems
                .Where(ci => ci.ProductVariant.Product.SellerProfile.Status == SellerStatus.Active
                          && ci.ProductVariant.Product.ApprovalStatus == ApprovalStatus.Approved)
                .ToList();

            if (!activeItems.Any())
                throw new Exception("No eligible items in cart. Products may belong to inactive sellers or are not approved.");

            // ── 4. Validate stock ──────────────────────────────────────────────
            var stockErrors = activeItems
                .Where(ci => ci.ProductVariant.StockQuantity < ci.Quantity)
                .Select(ci =>
                    $"'{ci.ProductVariant.Product.Name}' " +
                    $"({ci.ProductVariant.Color}/{ci.ProductVariant.Size}) — " +
                    $"requested {ci.Quantity}, only {ci.ProductVariant.StockQuantity} left.")
                .ToList();

            if (stockErrors.Any())
                throw new Exception($"Stock conflict:\n{string.Join("\n", stockErrors)}");

            // ── 5. Validate coupon ─────────────────────────────────────────────
            Coupon? coupon = null;
            decimal subtotal = activeItems.Sum(ci => ci.Quantity * ci.ProductVariant.Price);

            if (!string.IsNullOrWhiteSpace(request.CouponCode))
            {
                coupon = await _unitOfWork.CouponRepository.GetByCodeAsync(request.CouponCode);

                if (coupon == null)
                    throw new Exception("Coupon not found.");
                if (coupon.ExpiryDate < DateTime.UtcNow)
                    throw new Exception("Coupon has expired.");
                if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit)
                    throw new Exception("Coupon usage limit reached.");
                if (coupon.MinOrderAmount.HasValue && subtotal < coupon.MinOrderAmount)
                    throw new Exception($"Minimum order amount for this coupon is {coupon.MinOrderAmount:C}.");

                var alreadyUsed = await _unitOfWork.CouponRepository
                    .HasUserUsedCouponAsync(userId, coupon.CouponId);
                if (alreadyUsed)
                    throw new Exception("You have already used this coupon.");
            }

            // ── 6. Compute total ───────────────────────────────────────────────
            decimal discount = 0;
            if (coupon != null)
            {
                discount = coupon.DiscountType == DiscountType.Percentage
                    ? subtotal * coupon.DiscountValue / 100
                    : coupon.DiscountValue;
            }
            decimal totalAmount = Math.Max(0, subtotal - discount);

            var commissionRate = Convert.ToDecimal(_config["Commission:DefaultRatePercent"] ?? "10");

            try
            {
                // ── 7. Create Order ────────────────────────────────────────────
                var order = new Order
                {
                    UserId = userId,
                    AddressId = address.AddressId,
                    CouponId = coupon?.CouponId,
                    TotalAmount = totalAmount,
                    Status = OrderStatus.Placed,
                    PaymentStatus = OrderPaymentStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.OrderRepository.Add(order);
                await _unitOfWork.CompleteAsync();

                // ── 8. Group by seller → SubOrders + OrderItems + Commissions ──
                var grouped = activeItems.GroupBy(ci => ci.ProductVariant.Product.SellerId);

                foreach (var sellerGroup in grouped)
                {
                    var subOrder = new SubOrder
                    {
                        OrderId = order.OrderId,
                        SellerId = sellerGroup.Key,
                        Status = SubOrderStatus.Placed,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _unitOfWork.SubOrderRepository.Add(subOrder);
                    await _unitOfWork.CompleteAsync();

                    foreach (var cartItem in sellerGroup)
                    {
                        var variant = cartItem.ProductVariant;
                        variant.StockQuantity -= cartItem.Quantity;

                        var orderItem = new OrderItem
                        {
                            SubOrderId = subOrder.SubOrderId,
                            VariantId = variant.VariantId,
                            Quantity = cartItem.Quantity,
                            PriceAtPurchase = variant.Price,
                            CreatedAt = DateTime.UtcNow
                        };

                        await _unitOfWork.OrderItemRepository.Add(orderItem);
                        await _unitOfWork.CompleteAsync();

                        var saleAmount = cartItem.Quantity * variant.Price;
                        await _unitOfWork.SellerCommissionRepository.Add(new SellerCommission
                        {
                            SellerId = sellerGroup.Key,
                            OrderItemId = orderItem.OrderItemId,
                            SaleAmount = saleAmount,
                            CommissionRate = commissionRate,
                            CommissionAmount = saleAmount * commissionRate / 100,
                            Status = SellerCommissionStatus.Pending,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    await _unitOfWork.NotificationRepository.Add(new Notification
                    {
                        UserId = sellerGroup.First().ProductVariant.Product.SellerProfile.UserId,
                        Message = $"You have a new order (Order #{order.OrderId}).",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // ── 9. Apply coupon usage ──────────────────────────────────────
                if (coupon != null)
                {
                    coupon.UsedCount++;
                    await _unitOfWork.CouponRepository.AddUsageAsync(new UserCouponUsage
                    {
                        UserId = userId,
                        CouponId = coupon.CouponId,
                        OrderId = order.OrderId,
                        UsedAt = DateTime.UtcNow
                    });
                }

                // ── 10. Clear cart ─────────────────────────────────────────────
                await _unitOfWork.CartRepository.ClearCartItemsAsync(cart.CartId);
                await _unitOfWork.CompleteAsync();

                var placed = await _unitOfWork.OrderRepository.GetByIdWithDetailsAsync(order.OrderId);
                return MapOrderToDto(placed!);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new Exception("Stock conflict — another purchase occurred at the same time. Please try again.");
            }
        }

        public async Task<OrderConfirmationResponseDto> GetOrderAsync(string userId, int orderId)
        {
            var order = await _unitOfWork.OrderRepository.GetByIdWithDetailsAsync(orderId);

            if (order == null)
                throw new KeyNotFoundException("Order not found.");

            if (order.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this order.");

            return MapOrderToDto(order);
        }

        public async Task<IEnumerable<OrderConfirmationResponseDto>> GetOrdersForUserAsync(
            string userId, int page, int pageSize)
        {
            var orders = await _unitOfWork.OrderRepository.GetByUserIdAsync(userId, page, pageSize);
            return orders.Select(MapOrderToDto);
        }

        public async Task CancelOrderAsync(string userId, int orderId)
        {
            var order = await _unitOfWork.OrderRepository.GetByIdWithDetailsAsync(orderId);

            if (order == null)
                throw new KeyNotFoundException("Order not found.");

            if (order.UserId != userId)
                throw new UnauthorizedAccessException("You do not have access to this order.");

            if (order.Status != OrderStatus.Placed)
                throw new Exception($"Order cannot be cancelled — current status is {order.Status}.");

            if (order.SubOrders.Any(s => s.Status != SubOrderStatus.Placed))
                throw new Exception("Order cannot be cancelled — one or more items are already being processed.");

            foreach (var subOrder in order.SubOrders)
            {
                subOrder.Status = SubOrderStatus.Cancelled;
                subOrder.UpdatedAt = DateTime.UtcNow;

                foreach (var item in subOrder.OrderItems)
                    item.ProductVariant.StockQuantity += item.Quantity;

                await _unitOfWork.NotificationRepository.Add(new Notification
                {
                    UserId = subOrder.SellerProfile.UserId,
                    Message = $"Order #{order.OrderId} has been cancelled by the customer.",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();
        }

        // ══════════════════════════════════════════════════════════════════════
        // SELLER
        // ══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<SubOrderDto>> GetSellerSubOrdersAsync(
            string userId, string? statusFilter, int page, int pageSize)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var subOrders = await _unitOfWork.SubOrderRepository
                .GetBySellerIdAsync(seller.SellerId, statusFilter, page, pageSize);

            return subOrders.Select(MapSubOrderToDto);
        }

        public async Task UpdateSubOrderStatusAsync(
            string userId, int subOrderId, UpdateSubOrderStatusRequestDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var subOrder = await _unitOfWork.SubOrderRepository.GetByIdWithDetailsAsync(subOrderId);
            if (subOrder == null)
                throw new KeyNotFoundException("SubOrder not found.");

            if (subOrder.SellerId != seller.SellerId)
                throw new UnauthorizedAccessException("You do not own this SubOrder.");

            if (!Enum.TryParse<SubOrderStatus>(request.Status, ignoreCase: true, out var newStatus))
                throw new Exception($"Invalid status '{request.Status}'.");

            ValidateTransition(subOrder.Status, newStatus);

            subOrder.Status = newStatus;
            subOrder.UpdatedAt = DateTime.UtcNow;

            if (newStatus == SubOrderStatus.Shipped)
            {
                if (string.IsNullOrWhiteSpace(request.Carrier) || string.IsNullOrWhiteSpace(request.TrackingNumber))
                    throw new Exception("Carrier and TrackingNumber are required when marking as Shipped.");

                var shipping = await _unitOfWork.ShippingRepository.GetBySubOrderIdAsync(subOrderId);

                if (shipping == null)
                {
                    await _unitOfWork.ShippingRepository.Add(new Shipping
                    {
                        SubOrderId = subOrderId,
                        Carrier = request.Carrier,
                        TrackingNumber = request.TrackingNumber,
                        Status = ShippingStatus.Shipped,
                        ShippedAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    shipping.Carrier = request.Carrier;
                    shipping.TrackingNumber = request.TrackingNumber;
                    shipping.Status = ShippingStatus.Shipped;
                    shipping.ShippedAt = DateTime.UtcNow;
                    shipping.UpdatedAt = DateTime.UtcNow;
                }
            }
            else if (newStatus == SubOrderStatus.Delivered)
            {
                var shipping = await _unitOfWork.ShippingRepository.GetBySubOrderIdAsync(subOrderId);
                if (shipping == null)
                    throw new Exception("Cannot mark as Delivered — no Shipping record exists. Mark as Shipped first.");

                shipping.Status = ShippingStatus.Delivered;
                shipping.ShippedAt = DateTime.UtcNow;
                shipping.UpdatedAt = DateTime.UtcNow;
            }

            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = subOrder.Order.UserId,
                Message = $"Your order from {subOrder.SellerProfile.StoreName} is now {newStatus}.",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.CompleteAsync();
        }

        // ── Transition validation ──────────────────────────────────────────────
        private static readonly Dictionary<SubOrderStatus, SubOrderStatus[]> _allowedTransitions = new()
        {
            { SubOrderStatus.Placed,     new[] { SubOrderStatus.Processing, SubOrderStatus.Cancelled } },
            { SubOrderStatus.Processing, new[] { SubOrderStatus.Shipped,    SubOrderStatus.Cancelled } },
            { SubOrderStatus.Shipped,    new[] { SubOrderStatus.Delivered } },
            { SubOrderStatus.Delivered,  Array.Empty<SubOrderStatus>() },
            { SubOrderStatus.Cancelled,  Array.Empty<SubOrderStatus>() },
        };

        private static void ValidateTransition(SubOrderStatus current, SubOrderStatus next)
        {
            if (!_allowedTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next))
                throw new Exception($"Invalid transition: {current} → {next}.");
        }

        // ── Mappers ────────────────────────────────────────────────────────────
        private static OrderConfirmationResponseDto MapOrderToDto(Order order) => new()
        {
            OrderId = order.OrderId,
            TotalAmount = order.TotalAmount,
            Status = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            CreatedAt = order.CreatedAt,
            SubOrders = order.SubOrders.Select(MapSubOrderToDto).ToList()
        };

        private static SubOrderDto MapSubOrderToDto(SubOrder s) => new()
        {
            SubOrderId = s.SubOrderId,
            SellerId = s.SellerId,
            StoreName = s.SellerProfile?.StoreName ?? string.Empty,
            Status = s.Status.ToString(),
            Items = s.OrderItems.Select(i => new OrderItemDto
            {
                OrderItemId = i.OrderItemId,
                VariantId = i.VariantId,
                ProductName = i.ProductVariant?.Product?.Name ?? string.Empty,
                Color = i.ProductVariant?.Color,
                Size = i.ProductVariant?.Size,
                Quantity = i.Quantity,
                PriceAtPurchase = i.PriceAtPurchase
            }).ToList()
        };
    }
}