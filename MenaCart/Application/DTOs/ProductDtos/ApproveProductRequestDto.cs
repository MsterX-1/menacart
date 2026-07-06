using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ProductDtos
{
    public class ApproveProductRequestDto
    {
        [Required]
        [RegularExpression("^(Approved|Rejected)$", ErrorMessage = "Status must be 'Approved' or 'Rejected'.")]
        public string Status { get; set; } = string.Empty;

        public string? RejectionReason { get; set; }
    }
}
