using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.ReturnDtos
{
    public class UpdateReturnStatusRequestDto
    {
        [Required]
        [RegularExpression("^(Approved|Rejected|Completed)$",
            ErrorMessage = "Status must be 'Approved', 'Rejected', or 'Completed'.")]
        public string Status { get; set; } = string.Empty;

        /// <summary>Required when Status = Approved (Return type).</summary>
        public decimal? RefundAmount { get; set; }

        public string? Note { get; set; }
    }
}
