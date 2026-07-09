using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class SellerResponseDto
    {
        public int SellerId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string StoreName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public decimal? CommissionRate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
