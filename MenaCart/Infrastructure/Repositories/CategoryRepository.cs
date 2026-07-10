using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repository
{
    public class CategoryRepository : GenaricRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Category>> GetCategoriesWithChildrenAsync()
        {
            return await _dbSet
                .Include(c => c.ParentCategory)
                .Include(c => c.ChildCategories)
                .ToListAsync();
        }

        public async Task<bool> HasChildCategoriesAsync(int categoryId)
        {
            return await _context.Categories.AnyAsync(c => c.ParentCategoryId == categoryId);
        }

        public async Task<bool> HasProductsAsync(int categoryId)
        {
            return await _context.Products.AnyAsync(p => p.CategoryId == categoryId);
        }
    }
}
