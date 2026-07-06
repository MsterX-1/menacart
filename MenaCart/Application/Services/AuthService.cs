using Application.DTOs.AuthDtos;
using Application.Extentions;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Domain.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;

        public AuthService(
            UserManager<User> userManager,
            IUnitOfWork unitOfWork,
            IConfiguration config)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _config = config;
        }

        /// <summary>
        /// Creates a JWT token with user claims and roles
        /// Token expiration is configured in appsettings.json
        /// </summary>
        private async Task<JwtSecurityToken> CreateJwtToken(User user)
        {
            // Get user claims (if any custom claims exist)
            var userClaims = await _userManager.GetClaimsAsync(user);

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            var roleClaims = roles.Select(role => new Claim(ClaimTypes.Role, role)).ToList();

            // Standard JWT claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier,$"{user.Id}"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add user claims
            claims.AddRange(userClaims);

            // Add role claims
            claims.AddRange(roleClaims);

            // Get JWT configuration from appsettings.json
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["JWT:SecretKey"]));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expires = DateTime.UtcNow.AddMinutes(
                Convert.ToDouble(_config["JWT:DurationInMinutes"]));

            return new JwtSecurityToken(
                issuer: _config["JWT:Issuer"],
                audience: _config["JWT:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: credentials
            );
        }

        /// <summary>
        /// Generates a cryptographically secure refresh token.
        /// </summary>
        private RefreshToken GenerateRefreshToken(User user)
        {
            var randomNumber = new byte[64];

            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);

            return new RefreshToken
            {
                UserId = user.Id,
                Token = Convert.ToBase64String(randomNumber),
                Expires = DateTime.UtcNow.AddDays(
                    Convert.ToDouble(_config["RefreshToken:DurationInDays"])),
                Created = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Refreshes JWT using a valid refresh token.
        /// Rotates refresh token (old one revoked, new one issued).
        /// </summary>
        public async Task<AuthResult> RefreshTokenAsync(string token)
        {
            var existingToken = await _unitOfWork.RefreshTokenRepository
                .GetRefreshTokenByTokenAsync(token);

            if (existingToken == null || !existingToken.IsActive)
                throw new Exception("Invalid or expired refresh token.");

            var user = await _userManager.FindByIdAsync(existingToken.UserId);

            if (user == null)
                throw new Exception("User not found.");

            // Generate new JWT
            var jwtToken = await CreateJwtToken(user);

            // Generate new refresh token (ROTATION)
            var newRefreshToken = GenerateRefreshToken(user);

            // Add new refresh token (NOT SAVED YET — handled by UnitOfWork)
            await _unitOfWork.RefreshTokenRepository
                .AddAsync(newRefreshToken);

            // Revoke old refresh token (only mark state, NOT saving)
            await _unitOfWork.RefreshTokenRepository
                .RevokeRefreshTokenAsync(existingToken.Token);

            // Commit ALL changes in one transaction (UnitOfWork responsibility)
            await _unitOfWork.CompleteAsync();

            return new AuthResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
                TokenExpiresOn = jwtToken.ValidTo,
                RefreshToken = newRefreshToken.Token,
                RefreshTokenExpiration = newRefreshToken.Expires
            };
        }

        /// <summary>
        /// Registers a new user and returns JWT + Refresh Token.
        /// </summary>
        public async Task<AuthResult> Register(RegisterDto dto)
        {
            // Check if username already exists
            if (await _userManager.FindByNameAsync(dto.UserName) != null)
                throw new Exception("Username already exists.");

            // Check if email already exists
            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                throw new Exception("Email already exists.");

            var user = dto.ConvertToUser();

            // Create user with password
            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"User creation failed: {errors}");
            }

            // Assign default role (e.g., "Customer") - ensure this role exists in the system
            await _userManager.AddToRoleAsync(user, dto.Role);
            if (dto.Role == "Seller")
            {
                await _unitOfWork.SellerRepository.Add(new SellerProfile
                {
                    UserId = user.Id,
                    StoreName = $"{dto.FirstName}'s Store",
                    StoreDescription = string.Empty,
                    StoreLogoUrl = string.Empty,
                    StoreBannerUrl = string.Empty,
                    StoreAddress = string.Empty,
                    Phone = string.Empty,
                    Rating = 0,
                    IsVerified = false,
                    Status = SellerStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await _unitOfWork.CompleteAsync();
            }
            // Generate JWT
            var jwtToken = await CreateJwtToken(user);

            // Generate refresh token
            var refreshToken = GenerateRefreshToken(user);

            // Add refresh token (NO SAVE HERE)
            await _unitOfWork.RefreshTokenRepository.AddAsync(refreshToken);

            // Commit changes (UnitOfWork)
            await _unitOfWork.CompleteAsync();

            return new AuthResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
                TokenExpiresOn = jwtToken.ValidTo,
                RefreshToken = refreshToken.Token,
                RefreshTokenExpiration = refreshToken.Expires
            };
        }

        /// <summary>
        /// Authenticates user credentials and issues JWT + Refresh Token.
        /// </summary>
        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByNameAsync(dto.Username);

            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                throw new Exception("Invalid username or password.");

            var jwtToken = await CreateJwtToken(user);

            var newRefreshToken = GenerateRefreshToken(user);

            // Add refresh token (NO SAVE HERE)
            await _unitOfWork.RefreshTokenRepository.AddAsync(newRefreshToken);

            // Commit changes (UnitOfWork)
            await _unitOfWork.CompleteAsync();

            return new AuthResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
                TokenExpiresOn = jwtToken.ValidTo,
                RefreshToken = newRefreshToken.Token,
                RefreshTokenExpiration = newRefreshToken.Expires
            };
        }

        /// <summary>
        /// Logs out user from ALL devices by revoking all refresh tokens.
        /// </summary>
        public async Task<bool> LogoutAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                throw new Exception("User not found.");

            // Mark all refresh tokens as revoked (NO SAVE HERE)
            await _unitOfWork.RefreshTokenRepository
                .RevokeAllUserRefreshTokensAsync(user.Id);

            // Commit changes (UnitOfWork)
            await _unitOfWork.CompleteAsync();

            return true;
        }
    }
}