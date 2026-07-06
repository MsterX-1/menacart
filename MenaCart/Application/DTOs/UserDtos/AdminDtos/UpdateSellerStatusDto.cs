using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class UpdateSellerStatusDto
    {
        [Required]
        [RegularExpression("^(Active|Suspended|Rejected)$",
            ErrorMessage = "Status must be 'Active', 'Suspended', or 'Rejected'.")]
        public string Status { get; set; } = string.Empty;

        public string? Reason { get; set; }
    }
}
