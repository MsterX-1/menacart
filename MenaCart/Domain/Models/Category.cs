using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public int? ParentCategoryId { get; set; }

        // Navigation
        [ForeignKey(nameof(ParentCategoryId))]
        public Category ParentCategory { get; set; }

        public ICollection<Category> ChildCategories { get; set; }
        public ICollection<Product> Products { get; set; }
    }
}
