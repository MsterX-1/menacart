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

        /// <summary>
        /// Cancel an order. Only possible while status is Placed
        /// and no suborder has started processing.
        /// </summary>
        [HttpDelete("{orderId}/cancel")]
        public async Task<IActionResult> CancelOrder(int orderId)
        {
            try
            {
                var userId = User.GetUserId();
                await _orderService.CancelOrderAsync(userId, orderId);
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

        public class ApplyCouponRequest
        {
            public string CouponCode { get; set; } = string.Empty;
        }

        /// <summary>
        /// Apply a coupon to an existing pending order.
        /// </summary>
        [HttpPost("{orderId}/apply-coupon")]
        public async Task<IActionResult> ApplyCoupon(int orderId, [FromBody] ApplyCouponRequest request)
        {
            try
            {
                var userId = User.GetUserId();
                await _orderService.ApplyCouponToOrderAsync(userId, orderId, request.CouponCode);
                return Ok(new { message = "Coupon applied successfully." });
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
        /// Generates a new payment session for a pending order.
        /// </summary>
        [HttpPost("{orderId}/pay")]
        public async Task<IActionResult> PayForOrder(int orderId)
        {
            try
            {
                var userId = User.GetUserId();
                var paymentUrl = await _orderService.GeneratePaymentSessionAsync(userId, orderId);
                return Ok(new { paymentUrl });
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
        /// Manually verify payment session status with Stripe (useful for frontend success callback without webhooks).
        /// </summary>
        [HttpPost("{orderId}/verify-payment")]
        public async Task<IActionResult> VerifyPayment(int orderId, [FromQuery] string sessionId)
        {
            try
            {
                // We verify that the user owns the order
                var userId = User.GetUserId();
                var order = await _orderService.GetOrderAsync(userId, orderId); // Will throw if not authorized/not found
                
                await _orderService.VerifyPaymentSessionAsync(sessionId);
                return Ok();
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
