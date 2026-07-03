using Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Domain.Security
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }
        public required string UserId { get; set; }
        public required string Token { get; set; }
        public required DateTime Expires { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Revoked { get; set; }
        [NotMapped]
        public bool IsActive => Revoked == null && !IsExpired;
        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= Expires;
        // Navigation Property
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
