using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.AuthDtos
{
    public class AuthResponseDto
    {
        public required string Token { get; set; }
        public DateTime TokenExpiresOn { get; set; }
        public List<string> Roles { get; set; } = new();
    }
}
