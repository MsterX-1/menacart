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
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                    .ThenInclude(pv => pv.Images)
                .FirstOrDefaultAsync(p => p.ProductId == productId);
        }

        public async Task<IEnumerable<Product>> BrowseAsync(
            string? search, int? categoryId, int? sellerId, int page, int pageSize, string? excludeUserId = null)
        {
            var query = _dbSet
                .Where(p => p.ApprovalStatus == ApprovalStatus.Approved && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.SellerProfile)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                    .ThenInclude(pv => pv.Images)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    (p.Brand != null && p.Brand.Contains(search)) ||
                    (p.Description != null && p.Description.Contains(search)));

            if (categoryId.HasValue)
            {
                var targetCategoryId = categoryId.Value;
                var allCategories = _context.Categories.ToList();
                
                var descendantCategoryIds = new List<int>();
                var queue = new Queue<int>();
                queue.Enqueue(targetCategoryId);
                
                while (queue.Count > 0)
                {
                    var currentId = queue.Dequeue();
                    descendantCategoryIds.Add(currentId);
                    
                    var children = allCategories.Where(c => c.ParentCategoryId == currentId).Select(c => c.CategoryId);
                    foreach (var childId in children)
                    {
                        queue.Enqueue(childId);
                    }
                }

                query = query.Where(p => descendantCategoryIds.Contains(p.CategoryId));
            }

            if (sellerId.HasValue)
                query = query.Where(p => p.SellerId == sellerId.Value);

            if (!string.IsNullOrEmpty(excludeUserId))
                query = query.Where(p => p.SellerProfile.UserId != excludeUserId);

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
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                    .ThenInclude(pv => pv.Images)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetPendingAsync(int page, int pageSize)
        {
            return await _dbSet
                .Where(p => p.ApprovalStatus == ApprovalStatus.Pending && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.SellerProfile)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductVariants)
                    .ThenInclude(pv => pv.Images)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}
