using System.Collections.Generic;

namespace Application.DTOs.CategoryDtos
{
    public class CategoryDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentCategoryId { get; set; }
        public string? ParentCategoryName { get; set; }
        public List<CategoryDto> ChildCategories { get; set; } = new();
    }
}
