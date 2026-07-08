using Application.DTOs.CategoryDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetCategoriesTreeAsync();
        Task<CategoryDto> GetCategoryByIdAsync(int id);
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto request);
        Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto request);
        Task DeleteCategoryAsync(int id);
    }
}
