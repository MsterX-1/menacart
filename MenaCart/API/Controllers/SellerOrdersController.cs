using API.Extensions;
using Application.DTOs.OrderDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/seller/suborders")]
    [Authorize(Roles = "Seller")]
    public class SellerOrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public SellerOrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        /// <summary>
        /// Get all SubOrders belonging to the authenticated seller.
        /// Optional status filter: Placed, Processing, Shipped, Delivered, Cancelled.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMySubOrders(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _orderService.GetSellerSubOrdersAsync(userId, status, page, pageSize);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update the status of a SubOrder the seller owns.
        /// Placed → Processing → Shipped (requires Carrier + TrackingNumber) → Delivered
        /// Placed or Processing → Cancelled
        /// </summary>
        [HttpPatch("{subOrderId}/status")]
        public async Task<IActionResult> UpdateStatus(
            int subOrderId,
            [FromBody] UpdateSubOrderStatusRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                await _orderService.UpdateSubOrderStatusAsync(userId, subOrderId, request);
                return NoContent();
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