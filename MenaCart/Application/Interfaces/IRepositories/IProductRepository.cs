using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IProductRepository : IGenaricRepository<Product>
    {
        /// <summary>
        /// Returns product with Category, SellerProfile, and Variants included.
        /// </summary>
        Task<Product?> GetByIdWithDetailsAsync(int productId);

        /// <summary>
        /// Paginated browse — only Approved products visible to public.
        /// Filters: categoryId, sellerId, search term (name/brand/description).
        /// </summary>
        Task<IEnumerable<Product>> BrowseAsync(
            string? search,
            int? categoryId,
            int? sellerId,
            int page,
            int pageSize);

        /// <summary>
        /// All products (any status) for a specific seller — for seller dashboard.
        /// </summary>
        Task<IEnumerable<Product>> GetBySellerIdAsync(int sellerId, int page, int pageSize);
    }
}
