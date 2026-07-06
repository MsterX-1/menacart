using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IProductVariantRepository : IGenaricRepository<ProductVariant>
    {
        Task<bool> SkuExistsAsync(string sku, int? excludeVariantId = null);
    }
}
