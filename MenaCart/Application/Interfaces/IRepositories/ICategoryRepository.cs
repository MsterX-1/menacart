using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ICategoryRepository : IGenaricRepository<Category>
    {
        Task<IEnumerable<Category>> GetCategoriesWithChildrenAsync();
        Task<bool> HasChildCategoriesAsync(int categoryId);
        Task<bool> HasProductsAsync(int categoryId);
    }
}
