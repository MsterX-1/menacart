using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class ProductVariantRepository : GenaricRepository<ProductVariant>, IProductVariantRepository
    {
        public ProductVariantRepository(AppDbContext context) : base(context) { }

        public async Task<bool> SkuExistsAsync(string sku, int? excludeVariantId = null)
        {
            var query = _dbSet.Where(v => v.Sku == sku);
            if (excludeVariantId.HasValue)
                query = query.Where(v => v.VariantId != excludeVariantId.Value);
            return await query.AnyAsync();
        }
    }
}
