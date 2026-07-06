using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class BanSellerEmailDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}
