using API.Extensions;
using Application.DTOs.ReturnDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    public class ReturnsController : ControllerBase
    {
        private readonly IReturnService _returnService;

        public ReturnsController(IReturnService returnService)
        {
            _returnService = returnService;
        }

        // ── Customer ───────────────────────────────────────────────────────────

        /// <summary>
        /// Request a return or exchange for a delivered order item.
        /// </summary>
        [HttpPost("api/returns")]
        [Authorize(Roles = "Customer,Seller")]
        public async Task<IActionResult> CreateReturn([FromBody] CreateReturnRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _returnService.CreateReturnAsync(userId, request);
                return CreatedAtAction(nameof(GetMyReturns), result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all return requests made by the authenticated customer.
        /// </summary>
        [HttpGet("api/returns/my")]
        [Authorize(Roles = "Customer,Seller")]
        public async Task<IActionResult> GetMyReturns(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = User.GetUserId();
            var result = await _returnService.GetMyReturnsAsync(userId, page, pageSize);
            return Ok(result);
        }

        // ── Seller ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Get all return requests for the authenticated seller's items.
        /// </summary>
        [HttpGet("api/seller/returns")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> GetSellerReturns(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _returnService.GetSellerReturnsAsync(userId, page, pageSize);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Seller approves, rejects, or completes a return request.
        /// Requested → Approved or Rejected
        /// Approved  → Completed
        /// </summary>
        [HttpPatch("api/seller/returns/{returnId}/status")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateReturnStatus(
            int returnId,
            [FromBody] UpdateReturnStatusRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _returnService.UpdateReturnStatusAsync(userId, returnId, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
