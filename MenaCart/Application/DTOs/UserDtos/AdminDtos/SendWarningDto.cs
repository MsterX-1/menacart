using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class SendWarningDto
    {
        [Required]
        [StringLength(500, MinimumLength = 10)]
        public string Message { get; set; } = string.Empty;
    }
}
