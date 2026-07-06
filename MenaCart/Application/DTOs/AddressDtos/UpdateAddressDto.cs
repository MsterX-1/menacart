using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.AddressDtos
{
    public class UpdateAddressDto
    {
        [RegularExpression("^(Shipping|Billing)$", ErrorMessage = "AddressType must be 'Shipping' or 'Billing'.")]
        public string? AddressType { get; set; }

        [MaxLength(200)]
        public string? Street { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? State { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        [MaxLength(20)]
        public string? ZipCode { get; set; }

        public bool? IsDefault { get; set; }
    }
}
