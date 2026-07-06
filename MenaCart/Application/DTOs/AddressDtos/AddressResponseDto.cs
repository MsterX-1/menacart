using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.AddressDtos
{
    public class AddressResponseDto
    {
        public int AddressId { get; set; }
        public string AddressType { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? State { get; set; }
        public string Country { get; set; } = string.Empty;
        public string? ZipCode { get; set; }
        public bool IsDefault { get; set; }
    }
}
