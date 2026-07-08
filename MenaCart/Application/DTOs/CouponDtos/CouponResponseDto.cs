using System;

namespace Application.DTOs.CouponDtos
{
    public class CouponResponseDto
    {
        public int CouponId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public decimal? MinOrderAmount { get; set; }
    }
}
