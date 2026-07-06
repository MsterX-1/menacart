using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.UserDtos.AdminDtos
{

    public class CouponResponseDto
    {
        public int CouponId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
