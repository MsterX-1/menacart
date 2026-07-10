using Application.DTOs.ProductDtos;

namespace Application.Interfaces.IServices
{
    public interface IProductService
    {
        // Seller
        Task<ProductResponseDto> CreateProductAsync(string userId, CreateProductRequestDto request);
        Task<ProductResponseDto> UpdateProductAsync(string userId, int productId, UpdateProductRequestDto request);
        Task DeleteProductAsync(string userId, int productId);
        Task<IEnumerable<ProductResponseDto>> GetMyProductsAsync(string userId, int page, int pageSize);

        // Public
        Task<ProductResponseDto> GetByIdAsync(int productId);
        Task<IEnumerable<ProductResponseDto>> BrowseAsync(string? search, int? categoryId, int? sellerId, int page, int pageSize);

        // Admin
        Task<ProductResponseDto> ApproveProductAsync(int productId, ApproveProductRequestDto request);
        Task<IEnumerable<ProductResponseDto>> GetPendingProductsAsync(int page, int pageSize);
    }
}
