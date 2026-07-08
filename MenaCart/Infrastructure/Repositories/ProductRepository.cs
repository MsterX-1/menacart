using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class ProductRepository : GenaricRepository<Product>, IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context) { }

        public async Task<Product?> GetByIdWithDetailsAsync(int productId)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.SellerProfile)
                .Include(p => p.ProductVariants)
                .FirstOrDefaultAsync(p => p.ProductId == productId);
        }

        public async Task<IEnumerable<Product>> BrowseAsync(
            string? search, int? categoryId, int? sellerId, int page, int pageSize)
        {
            var query = _dbSet
                .Where(p => p.ApprovalStatus == ApprovalStatus.Approved && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.SellerProfile)
                .Include(p => p.ProductVariants)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    (p.Brand != null && p.Brand.Contains(search)) ||
                    (p.Description != null && p.Description.Contains(search)));

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            if (sellerId.HasValue)
                query = query.Where(p => p.SellerId == sellerId.Value);

            return await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetBySellerIdAsync(int sellerId, int page, int pageSize)
        {
            return await _dbSet
                .Where(p => p.SellerId == sellerId)
                .Include(p => p.Category)
                .Include(p => p.SellerProfile)
                .Include(p => p.ProductVariants)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}
