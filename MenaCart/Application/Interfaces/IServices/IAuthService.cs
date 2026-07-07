using Application.DTOs.AuthDtos;
using Domain.Models;
using Domain.Security;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace Application.Interfaces.IServices
{
    public interface IAuthService
    {
        public Task<AuthResult> RefreshTokenAsync(string token);
        public Task<AuthResult> RegisterAsync(RegisterDto dto);
        public Task<AuthResult> LoginAsync(LoginDto dto);
        public Task<bool> LogoutAsync(string userId);
        public Task<bool> RevokeTokenAsync(string token);
    }
}
