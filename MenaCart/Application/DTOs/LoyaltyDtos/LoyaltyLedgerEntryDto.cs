using System;

namespace Application.DTOs.LoyaltyDtos
{
    public class LoyaltyLedgerEntryDto
    {
        public int PointsId { get; set; }
        public int Points { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
