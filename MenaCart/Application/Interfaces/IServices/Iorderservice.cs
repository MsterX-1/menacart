using Application.DTOs.OrderDtos;

namespace Application.Interfaces.IServices
{
    public interface IOrderService
    {
        // Buyer
        Task<OrderConfirmationResponseDto> PlaceOrderAsync(string userId, CreateOrderRequestDto request);
        Task<OrderConfirmationResponseDto> GetOrderAsync(string userId, int orderId);
        Task<IEnumerable<OrderConfirmationResponseDto>> GetOrdersForUserAsync(string userId, int page, int pageSize);

        // Seller
        Task<IEnumerable<SubOrderDto>> GetSellerSubOrdersAsync(string userId, string? statusFilter, int page, int pageSize);
        Task UpdateSubOrderStatusAsync(string userId, int subOrderId, UpdateSubOrderStatusRequestDto request);
    }
}