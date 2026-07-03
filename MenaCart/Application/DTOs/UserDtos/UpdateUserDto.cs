using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.UserDtos
{
    public class UpdateUserDto
    {
        public required string UserId { get; set; } // The ID of the user to be updated

        // Other fields are optional for partial updates
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
