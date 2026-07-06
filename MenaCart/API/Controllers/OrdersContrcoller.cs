using API.Extensions;
using Application.DTOs.OrderDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize(Roles = "Customer")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        /// <summary>
        /// Place a new order from the authenticated buyer's cart.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _orderService.PlaceOrderAsync(userId, request);
                return CreatedAtAction(nameof(GetById), new { orderId = result.OrderId }, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex) when (ex.Message.Contains("Stock conflict"))
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific order by ID (buyer can only see their own).
        /// </summary>
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetById(int orderId)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _orderService.GetOrderAsync(userId, orderId);
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
        }

        /// <summary>
        /// Get all orders for the authenticated buyer (paginated).
        /// </summary>
        [HttpGet("myOrders")]
        public async Task<IActionResult> GetMyOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = User.GetUserId();
            var result = await _orderService.GetOrdersForUserAsync(userId, page, pageSize);
            return Ok(result);
        }
    }
}