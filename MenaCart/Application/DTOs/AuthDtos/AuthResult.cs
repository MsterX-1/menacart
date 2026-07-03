using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.AuthDtos
{
    public class AuthResult
    {
        public required string Token { get; set; }
        public DateTime TokenExpiresOn { get; set; }
        public required string RefreshToken { get; set; }
        public DateTime RefreshTokenExpiration { get; set; }
    }
}
