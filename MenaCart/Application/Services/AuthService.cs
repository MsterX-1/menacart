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
        private readonly SignInManager<User> _signInManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;

        public AuthService(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IUnitOfWork unitOfWork,
            IConfiguration config,
            IEmailService emailService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _unitOfWork = unitOfWork;
            _config = config;
            _emailService = emailService;
        }

        /// <summary>
        /// Creates a JWT token with user claims and roles
        /// Token expiration is configured in appsettings.json
        /// </summary>
        private async Task<JwtSecurityToken> CreateJwtToken(User user, IList<string> roles)
        {
            // Get user claims (if any custom claims exist)
            var userClaims = await _userManager.GetClaimsAsync(user);

            // Get user roles
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

            if (existingToken == null)
                throw new Exception("Invalid or expired refresh token.");

            if (existingToken.Revoked != null)
            {
                // REUSE DETECTION: revoke all active refresh tokens for this user
                await _unitOfWork.RefreshTokenRepository.RevokeAllUserRefreshTokensAsync(existingToken.UserId);
                await _unitOfWork.CompleteAsync();
                throw new Exception("Refresh token has already been revoked. Potential token theft detected. All sessions revoked.");
            }

            if (!existingToken.IsActive)
                throw new Exception("Invalid or expired refresh token.");

            var user = await _userManager.FindByIdAsync(existingToken.UserId);

            if (user == null)
                throw new Exception("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            // Generate new JWT
            var jwtToken = await CreateJwtToken(user, roles);

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
                RefreshTokenExpiration = newRefreshToken.Expires,
                Roles = roles.ToList()
            };
        }

        /// <summary>
        /// Registers a new user and returns JWT + Refresh Token.
        /// </summary>
        public async Task<AuthResult> RegisterAsync(RegisterDto dto)
        {
            var allowedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Customer", "Seller" };
            if (!allowedRoles.Contains(dto.Role))
                throw new Exception("Invalid role.");

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
            
            var roles = new List<string> { dto.Role };

            // Generate JWT
            var jwtToken = await CreateJwtToken(user, roles);

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
                RefreshTokenExpiration = refreshToken.Expires,
                Roles = roles
            };
        }

        /// <summary>
        /// Authenticates user credentials and issues JWT + Refresh Token.
        /// </summary>
        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null)
                throw new Exception("Invalid email or password.");

            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

            if (signInResult.IsLockedOut)
                throw new Exception("Account is locked out. Please try again later.");

            if (!signInResult.Succeeded)
                throw new Exception("Invalid email or password.");

            var roles = await _userManager.GetRolesAsync(user);

            var jwtToken = await CreateJwtToken(user, roles);

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
                RefreshTokenExpiration = newRefreshToken.Expires,
                Roles = roles.ToList()
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

        /// <summary>
        /// Revokes a single specific refresh token.
        /// </summary>
        public async Task<bool> RevokeTokenAsync(string token)
        {
            var existingToken = await _unitOfWork.RefreshTokenRepository
                .GetRefreshTokenByTokenAsync(token);

            if (existingToken != null && existingToken.IsActive)
            {
                await _unitOfWork.RefreshTokenRepository.RevokeRefreshTokenAsync(token);
                await _unitOfWork.CompleteAsync();
            }

            return true; // No-op success even if not found or already inactive
        }

        public async Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return true; // Pretend it worked for security

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // In a real app, generate a URL to the frontend with the token and email
            // frontend_url/reset-password?email=...&token=...
            var frontendUrl = _config["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

            await _emailService.SendEmailAsync(user.Email, "Reset Your Password",
                $"<p>Click the link below to reset your password:</p><p><a href=\"{resetLink}\">{resetLink}</a></p>");

            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) throw new Exception("User not found.");

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Failed to reset password: {errors}");
            }

            return true;
        }

        public async Task<AuthResult> GoogleLoginAsync(GoogleLoginDto dto)
        {
            Google.Apis.Auth.GoogleJsonWebSignature.Payload payload;
            try
            {
                var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string>() { _config["Authentication:Google:ClientId"] ?? "dummy" }
                };
                payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch (Exception ex)
            {
                // MOCK for local testing when valid token is "dummy-google-token"
                if (dto.IdToken == "dummy-google-token")
                {
                    payload = new Google.Apis.Auth.GoogleJsonWebSignature.Payload
                    {
                        Email = "mockuser@gmail.com",
                        GivenName = "Mock",
                        FamilyName = "User",
                        Subject = "mock-google-id-12345"
                    };
                }
                else
                {
                    throw new Exception("Invalid Google token.", ex);
                }
            }

            var user = await _userManager.FindByEmailAsync(payload.Email);
            if (user == null)
            {
                user = new User
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FirstName = payload.GivenName ?? "Google",
                    LastName = payload.FamilyName ?? "User",
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded) throw new Exception("Failed to create user from Google account.");

                var roleToAssign = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Customer", "Seller" }.Contains(dto.Role) ? dto.Role : "Customer";
                await _userManager.AddToRoleAsync(user, roleToAssign);

                if (roleToAssign == "Seller")
                {
                    await _unitOfWork.SellerRepository.Add(new SellerProfile
                    {
                        UserId = user.Id,
                        StoreName = $"{user.FirstName}'s Store",
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
            }

            var roles = await _userManager.GetRolesAsync(user);
            var jwtToken = await CreateJwtToken(user, roles);
            var newRefreshToken = GenerateRefreshToken(user);

            await _unitOfWork.RefreshTokenRepository.AddAsync(newRefreshToken);
            await _unitOfWork.CompleteAsync();

            return new AuthResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
                TokenExpiresOn = jwtToken.ValidTo,
                RefreshToken = newRefreshToken.Token,
                RefreshTokenExpiration = newRefreshToken.Expires,
                Roles = roles.ToList()
            };
        }
    }
}