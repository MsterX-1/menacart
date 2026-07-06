using Application.DTOs.AddressDtos;
using Application.DTOs.CartDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;

namespace Application.Services
{
    public class CartService : ICartService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CartService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CartResponseDto> GetCartAsync(string userId)
        {
            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CartItems = new List<CartItem>()
                };
                await _unitOfWork.CartRepository.Add(cart);
                await _unitOfWork.CompleteAsync();
            }

            // Load addresses for checkout
            var addresses = await _unitOfWork.AddressRepository.GetAllByUserIdAsync(userId);
            var addressList = addresses.ToList();

            return MapToDto(cart, addressList);
        }

        public async Task<CartResponseDto> AddItemAsync(string userId, AddCartItemDto request)
        {
            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CartItems = new List<CartItem>()
                };
                await _unitOfWork.CartRepository.Add(cart);
                await _unitOfWork.CompleteAsync();
            }

            var variant = await _unitOfWork.ProductVariantRepository.GetById(request.VariantId);
            if (variant == null)
                throw new KeyNotFoundException("Product variant not found.");

            if (variant.StockQuantity < request.Quantity)
                throw new Exception($"Only {variant.StockQuantity} units available.");

            var existing = cart.CartItems.FirstOrDefault(ci => ci.VariantId == request.VariantId);

            if (existing != null)
            {
                var newQty = existing.Quantity + request.Quantity;
                if (newQty > variant.StockQuantity)
                    throw new Exception($"Cannot add {request.Quantity} more. Only {variant.StockQuantity - existing.Quantity} additional units available.");

                existing.Quantity = newQty;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                await _unitOfWork.CartRepository.AddCartItemAsync(new CartItem
                {
                    CartId = cart.CartId,
                    VariantId = request.VariantId,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();

            var updated = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            var addresses = await _unitOfWork.AddressRepository.GetAllByUserIdAsync(userId);
            return MapToDto(updated!, addresses.ToList());
        }

        public async Task<CartResponseDto> UpdateItemAsync(string userId, int cartItemId, UpdateCartItemDto request)
        {
            var cartItem = await _unitOfWork.CartRepository.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null)
                throw new KeyNotFoundException("Cart item not found.");

            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            if (cart == null || cartItem.CartId != cart.CartId)
                throw new UnauthorizedAccessException("This item does not belong to your cart.");

            if (request.Quantity > cartItem.ProductVariant.StockQuantity)
                throw new Exception($"Only {cartItem.ProductVariant.StockQuantity} units available.");

            cartItem.Quantity = request.Quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.CompleteAsync();

            var updated = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            var addresses = await _unitOfWork.AddressRepository.GetAllByUserIdAsync(userId);
            return MapToDto(updated!, addresses.ToList());
        }

        public async Task RemoveItemAsync(string userId, int cartItemId)
        {
            var cartItem = await _unitOfWork.CartRepository.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null)
                throw new KeyNotFoundException("Cart item not found.");

            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            if (cart == null || cartItem.CartId != cart.CartId)
                throw new UnauthorizedAccessException("This item does not belong to your cart.");

            await _unitOfWork.CartRepository.RemoveCartItemAsync(cartItemId);
            await _unitOfWork.CompleteAsync();
        }

        public async Task ClearCartAsync(string userId)
        {
            var cart = await _unitOfWork.CartRepository.GetCartWithItemsByUserIdAsync(userId);
            if (cart == null || !cart.CartItems.Any())
                return;

            await _unitOfWork.CartRepository.ClearCartItemsAsync(cart.CartId);
            await _unitOfWork.CompleteAsync();
        }

        // ── Mapper ─────────────────────────────────────────────────────────────
        private static CartResponseDto MapToDto(Cart cart, List<Address> addresses) => new()
        {
            CartId = cart.CartId,
            Items = cart.CartItems?.Select(ci => new CartItemResponseDto
            {
                CartItemId = ci.CartItemId,
                VariantId = ci.VariantId,
                ProductId = ci.ProductVariant?.ProductId ?? 0,
                ProductName = ci.ProductVariant?.Product?.Name ?? string.Empty,
                Color = ci.ProductVariant?.Color,
                Size = ci.ProductVariant?.Size,
                ImageUrl = ci.ProductVariant?.ImageUrl,
                UnitPrice = ci.ProductVariant?.Price ?? 0,
                Quantity = ci.Quantity,
                StockQuantity = ci.ProductVariant?.StockQuantity ?? 0
            }).ToList() ?? new(),
            SavedAddresses = addresses.Select(a => new AddressResponseDto
            {
                AddressId = a.AddressId,
                AddressType = a.AddressType.ToString(),
                Street = a.Street,
                City = a.City,
                State = a.State,
                Country = a.Country,
                ZipCode = a.ZipCode,
                IsDefault = a.IsDefault
            }).ToList(),
            DefaultAddressId = addresses.FirstOrDefault(a => a.IsDefault)?.AddressId
        };
    }
}