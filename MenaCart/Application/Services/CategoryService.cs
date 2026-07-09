using Application.DTOs.CategoryDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<CategoryDto>> GetCategoriesTreeAsync()
        {
            var categories = await _unitOfWork.CategoryRepository.GetCategoriesWithChildrenAsync();
            var categoryList = categories.ToList();

            // Construct hierarchical tree (roots have ParentCategoryId == null)
            var roots = categoryList.Where(c => c.ParentCategoryId == null).ToList();

            return roots.Select(c => MapToDto(c, categoryList));
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(int id)
        {
            var category = await _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {id} not found.");

            var all = await _unitOfWork.CategoryRepository.GetCategoriesWithChildrenAsync();
            return MapToDto(category, all.ToList());
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto request)
        {
            if (request.ParentCategoryId.HasValue)
            {
                var parent = await _unitOfWork.CategoryRepository.GetById(request.ParentCategoryId.Value);
                if (parent == null)
                    throw new KeyNotFoundException($"Parent category with ID {request.ParentCategoryId.Value} not found.");
            }

            var category = new Category
            {
                Name = request.Name,
                ImageUrl = request.ImageUrl,
                ParentCategoryId = request.ParentCategoryId
            };

            await _unitOfWork.CategoryRepository.Add(category);
            await _unitOfWork.CompleteAsync();

            var all = await _unitOfWork.CategoryRepository.GetCategoriesWithChildrenAsync();
            return MapToDto(category, all.ToList());
        }

        public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto request)
        {
            var category = await _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {id} not found.");

            if (request.ParentCategoryId.HasValue)
            {
                if (request.ParentCategoryId.Value == id)
                    throw new Exception("A category cannot be its own parent.");

                var parent = await _unitOfWork.CategoryRepository.GetById(request.ParentCategoryId.Value);
                if (parent == null)
                    throw new KeyNotFoundException($"Parent category with ID {request.ParentCategoryId.Value} not found.");

                // Cyclic reference check (proposed parent cannot be a descendant of current category)
                var categories = await _unitOfWork.CategoryRepository.GetCategoriesWithChildrenAsync();
                var categoryList = categories.ToList();

                int? currentParentId = request.ParentCategoryId.Value;
                while (currentParentId.HasValue)
                {
                    if (currentParentId.Value == id)
                        throw new Exception("Cyclic reference detected: The proposed parent category is a descendant of this category.");

                    var nextParent = categoryList.FirstOrDefault(c => c.CategoryId == currentParentId.Value);
                    currentParentId = nextParent?.ParentCategoryId;
                }
            }

            category.Name = request.Name;
            category.ImageUrl = request.ImageUrl;
            category.ParentCategoryId = request.ParentCategoryId;

            await _unitOfWork.CategoryRepository.Update(category);
            await _unitOfWork.CompleteAsync();

            var all = await _unitOfWork.CategoryRepository.GetCategoriesWithChildrenAsync();
            return MapToDto(category, all.ToList());
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _unitOfWork.CategoryRepository.GetById(id);
            if (category == null)
                throw new KeyNotFoundException($"Category with ID {id} not found.");

            // 1. Check child categories
            var hasChildren = await _unitOfWork.CategoryRepository.HasChildCategoriesAsync(id);
            if (hasChildren)
                throw new Exception("This category has subcategories. Please reassign or delete them first.");

            // 2. Check products
            var hasProducts = await _unitOfWork.CategoryRepository.HasProductsAsync(id);
            if (hasProducts)
                throw new Exception("This category has products associated with it. Please reassign or remove the products first.");

            await _unitOfWork.CategoryRepository.Delete(id);
            await _unitOfWork.CompleteAsync();
        }

        // ── Helper Mapper ──────────────────────────────────────────────────────
        private static CategoryDto MapToDto(Category c, List<Category> all)
        {
            var dto = new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                ImageUrl = c.ImageUrl,
                ParentCategoryId = c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory?.Name
            };

            var children = all.Where(x => x.ParentCategoryId == c.CategoryId).ToList();
            dto.ChildCategories = children.Select(child => MapToDto(child, all)).ToList();

            return dto;
        }
    }
}
