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
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _authService.LoginAsync(dto);
                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiration);
                var response = new AuthResponseDto
                {
                    Token = result.Token,
                    TokenExpiresOn = result.TokenExpiresOn,
                    Roles = result.Roles
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Registers a new user and returns JWT + Refresh Token.
        /// Automatically logs in the user by issuing tokens.
        /// </summary>
        [HttpPost("Register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                var result = await _authService.RegisterAsync(dto);
                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiration);
                var response = new AuthResponseDto
                {
                    Token = result.Token,
                    TokenExpiresOn = result.TokenExpiresOn,
                    Roles = result.Roles
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
        [AllowAnonymous]
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
                    TokenExpiresOn = result.TokenExpiresOn,
                    Roles = result.Roles
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        /// <summary>
        /// Revokes the specified refresh token (or from cookie) and removes the cookie.
        /// </summary>
        [HttpPost("revoke")]
        [Authorize]
        public async Task<IActionResult> Revoke([FromBody] RevokeRequestDto? dto)
        {
            var token = dto?.RefreshToken;
            if (string.IsNullOrWhiteSpace(token))
            {
                Request.Cookies.TryGetValue("refreshToken", out token);
            }

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _authService.RevokeTokenAsync(token);
            }

            // Always delete the cookie to clear client state
            Response.Cookies.Delete("refreshToken");
            return NoContent();
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
        /// Logs out the current user by revoking the current session's refresh token
        /// and removing the refresh token cookie.
        /// </summary>
        [Authorize]
        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                if (Request.Cookies.TryGetValue("refreshToken", out var token))
                {
                    await _authService.RevokeTokenAsync(token);
                    Response.Cookies.Delete("refreshToken");
                }
                return Ok("Logged out successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Logs out the user from ALL devices by revoking all refresh tokens.
        /// </summary>
        [Authorize]
        [HttpPost("LogoutAll")]
        public async Task<IActionResult> LogoutAll()
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
                    Response.Cookies.Delete("refreshToken");
                    return Ok("Logged out from all devices successfully.");
                }
                else
                {
                    return BadRequest("Logout all failed.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
