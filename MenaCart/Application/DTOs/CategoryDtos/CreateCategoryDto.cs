using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.CategoryDtos
{
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public int? ParentCategoryId { get; set; }
    }
}
