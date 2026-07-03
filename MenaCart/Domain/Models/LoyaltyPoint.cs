using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class LoyaltyPoint
    {
        [Key]
        public int PointsId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public int Points { get; set; }

        [Required]
        [MaxLength(200)]
        public string Reason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }
    }
}
