using System.Collections.Generic;

namespace Application.DTOs.LoyaltyDtos
{
    public class LoyaltyResponseDto
    {
        public int Balance { get; set; }
        public List<LoyaltyLedgerEntryDto> Ledger { get; set; } = new();
    }
}
