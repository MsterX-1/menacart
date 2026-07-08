using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.SellerDtos
{
    public class ReviewSellerDocumentDto
    {
        [Required]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Status must be Approved or Rejected.")]
        public string Status { get; set; } = string.Empty;

        public string? RejectionReason { get; set; }
    }
}
