using Application.DTOs.AuthDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public AuthController(IAuthService authService, IUserService userService)
        {
            _authService = authService;
            _userService = userService;
        }


        /// <summary>
        /// Sets the refresh token as an HTTP-only cookie for enhanced security.
        /// Prevents JavaScript access to mitigate XSS attacks.
        /// </summary>
        private void SetRefreshTokenCookie(string refreshToken, DateTime expires)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,                 // Prevents JavaScript access (XSS protection)
                Expires = expires,              // Sync cookie lifetime with token expiration
                Secure = true,                 // Required for HTTPS
                SameSite = SameSiteMode.None, // Required for cross-site usage (SPA)
                IsEssential = true           // Ensures cookie is always sent
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        /// <summary>
        /// Authenticates the user and returns a JWT access token.
        /// Also sets a refresh token in an HTTP-only cookie.
        /// </summary>
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _authService.LoginAsync(dto);
                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiration);
                var response = new AuthResponseDto
                {
                    Token = result.Token,
                    TokenExpiresOn = result.TokenExpiresOn
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Registers a new user and returns a JWT access token.
        /// Automatically logs in the user by issuing tokens.
        /// </summary>
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                var result = await _authService.Register(dto);
                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiration);
                var response = new AuthResponseDto
                {
                    Token = result.Token,
                    TokenExpiresOn = result.TokenExpiresOn
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        /// <summary>
        /// Refreshes the JWT access token using a valid refresh token from cookies.
        /// Implements refresh token rotation.
        /// </summary>
        [HttpPost("RefreshToken")]
        public async Task<IActionResult> RefreshToken()
        {
            try
            {
                if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
                {
                    return Unauthorized("Refresh token cookie not found.");
                }
                var result = await _authService.RefreshTokenAsync(refreshToken);
                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiration);
                var response = new AuthResponseDto
                {
                    Token = result.Token,
                    TokenExpiresOn = result.TokenExpiresOn
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves the currently authenticated user's information
        /// based on the user ID stored in JWT claims.
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized("User ID claim not found.");

                var userId = userIdClaim.Value;

                var user = await _userService.GetUserByIdAsync(userId);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Logs out the current user by revoking all refresh tokens
        /// and removing the refresh token cookie.
        /// </summary>
        [Authorize]
        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized("User ID claim not found.");

                var userId = userIdClaim.Value;

                var result = await _authService.LogoutAsync(userId);
                if (result)
                {
                    // Remove the refresh token cookie
                    Response.Cookies.Delete("refreshToken");
                    return Ok("Logged out successfully.");
                }
                else
                {
                    return BadRequest("Logout failed.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
