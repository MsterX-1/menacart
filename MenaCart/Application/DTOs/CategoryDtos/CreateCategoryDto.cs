using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.CategoryDtos
{
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int? ParentCategoryId { get; set; }
    }
}
