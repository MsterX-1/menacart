using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class SellerBankInfo
    {
        [Key]
        public int BankInfoId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        [MaxLength(150)]
        public string BankName { get; set; }

        [Required]
        [MaxLength(50)]
        public string AccountNumber { get; set; }

        [Required]
        [MaxLength(150)]
        public string AccountHolder { get; set; }

        [MaxLength(50)]
        public string Iban { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(SellerId))]
        public SellerProfile SellerProfile { get; set; }
    }
}
