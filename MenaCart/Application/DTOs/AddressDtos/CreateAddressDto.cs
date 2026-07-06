using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.AddressDtos
{
    public class CreateAddressDto
    {
        [Required]
        [RegularExpression("^(Shipping|Billing)$", ErrorMessage = "AddressType must be 'Shipping' or 'Billing'.")]
        public string AddressType { get; set; } = "Shipping";

        [Required]
        [MaxLength(200)]
        public string Street { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? State { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ZipCode { get; set; }

        public bool IsDefault { get; set; } = false;
    }
}
