using Application.DTOs.ReturnDtos;

namespace Application.Interfaces.IServices
{
    public interface IReturnService
    {
        // Customer
        Task<ReturnResponseDto> CreateReturnAsync(string userId, CreateReturnRequestDto request);
        Task<IEnumerable<ReturnResponseDto>> GetMyReturnsAsync(string userId, int page, int pageSize);

        // Seller
        Task<IEnumerable<ReturnResponseDto>> GetSellerReturnsAsync(string userId, int page, int pageSize);
        Task<ReturnResponseDto> UpdateReturnStatusAsync(string userId, int returnId, UpdateReturnStatusRequestDto request);
    }
}
