using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.UserDtos
{
    public class ChangePasswordDto
    {
        public required string UserId { get; set; } // The ID of the user changing the password
        public required string OldPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}
