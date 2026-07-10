using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.PayoutDtos
{
    public class ReviewPayoutDto
    {
        [Required]
        [RegularExpression("^(Paid|Failed)$", ErrorMessage = "Status must be Paid or Failed.")]
        public string Status { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Transaction reference is required.")]
        [MaxLength(100)]
        public string TransactionRef { get; set; } = string.Empty;
    }
}
