using System;

namespace Application.DTOs.SellerDtos
{
    public class SellerDocumentDto
    {
        public int SellerDocumentId { get; set; }
        public int SellerId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
