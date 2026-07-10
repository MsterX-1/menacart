using API.Extensions;
using Application.DTOs.PayoutDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/payouts")]
    [Authorize]
    public class PayoutsController : ControllerBase
    {
        private readonly IPayoutService _payoutService;

        public PayoutsController(IPayoutService payoutService)
        {
            _payoutService = payoutService;
        }

        /// <summary>
        /// Seller requests a new payout of their settled commissions.
        /// </summary>
        [HttpPost("seller")]
        public async Task<IActionResult> RequestPayout([FromBody] RequestPayoutDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _payoutService.RequestPayoutAsync(userId, request);
                return CreatedAtAction(nameof(GetMyPayouts), null, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Seller gets their available settled commission balance.
        /// </summary>
        [HttpGet("seller/balance")]
        public async Task<IActionResult> GetAvailableBalance()
        {
            try
            {
                var userId = User.GetUserId();
                var balance = await _payoutService.GetAvailableBalanceAsync(userId);
                return Ok(new { availableBalance = balance });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Seller views their own payout request history.
        /// </summary>
        [HttpGet("seller")]
        public async Task<IActionResult> GetMyPayouts()
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _payoutService.GetMyPayoutsAsync(userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Admin retrieves all payout requests with optional status filtering.
        /// </summary>
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPayouts([FromQuery] string? status)
        {
            var result = await _payoutService.GetAllPayoutsForAdminAsync(status);
            return Ok(result);
        }

        /// <summary>
        /// Admin reviews (approves/rejects) a payout request.
        /// </summary>
        [HttpPatch("admin/{payoutId}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReviewPayout(int payoutId, [FromBody] ReviewPayoutDto request)
        {
            try
            {
                var result = await _payoutService.ReviewPayoutAsync(payoutId, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
