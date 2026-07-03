using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.AuthDtos
{
    public class RegisterDto
    {
        public required string UserName { get; set; }
        public required string Password { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
    }
}
