using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.AuthDtos
{
    public class LoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
