using API.Extensions;
using Application.DTOs.SellerDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/seller")]
    [Authorize]
    public class SellerOnboardingController : ControllerBase
    {
        private readonly ISellerOnboardingService _onboardingService;

        public SellerOnboardingController(ISellerOnboardingService onboardingService)
        {
            _onboardingService = onboardingService;
        }

        /// <summary>
        /// Apply to become a seller.
        /// </summary>
        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] ApplySellerDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _onboardingService.ApplyAsync(userId, request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get the authenticated user's own seller profile.
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _onboardingService.GetProfileAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update the authenticated user's own seller profile.
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] ApplySellerDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _onboardingService.UpdateProfileAsync(userId, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a public seller profile by ID.
        /// </summary>
        [HttpGet("profile/{sellerId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfileById(int sellerId)
        {
            try
            {
                var result = await _onboardingService.GetProfileByIdAsync(sellerId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a paginated list of active sellers (public).
        /// </summary>
        [HttpGet("public-list")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicSellers(
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _onboardingService.GetActiveSellersAsync(search, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
