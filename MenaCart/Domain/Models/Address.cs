using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public enum AddressType
    {
        Shipping,
        Billing
    }

    public class Address
    {
        [Key]
        public int AddressId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public AddressType AddressType { get; set; } = Models.AddressType.Shipping;

        [Required]
        [MaxLength(200)]
        public string Street { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; }

        [MaxLength(100)]
        public string State { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; }

        [MaxLength(20)]
        public string ZipCode { get; set; }

        public bool IsDefault { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        public ICollection<Order> Orders { get; set; }
    }
}
