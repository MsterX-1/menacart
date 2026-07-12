using Application.DTOs.UserDtos.AdminDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // ── Seller Management ──────────────────────────────────────────────────

        /// <summary>
        /// Get all sellers, optionally filtered by status: Pending, Active, Suspended, Rejected.
        /// </summary>
        [HttpGet("sellers")]
        public async Task<IActionResult> GetAllSellers(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _adminService.GetAllSellersAsync(status, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Approve, suspend, or reject a seller account.
        /// </summary>
        [HttpPatch("sellers/{sellerId}/status")]
        public async Task<IActionResult> UpdateSellerStatus(
            int sellerId,
            [FromBody] UpdateSellerStatusDto request)
        {
            try
            {
                var result = await _adminService.UpdateSellerStatusAsync(sellerId, request);
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
        /// Ban a seller's email and lock their account permanently.
        /// </summary>
        [HttpPost("sellers/{sellerId}/ban")]
        public async Task<IActionResult> BanSellerEmail(
            int sellerId,
            [FromBody] BanSellerEmailDto request)
        {
            try
            {
                await _adminService.BanSellerEmailAsync(sellerId, request);
                return Ok(new { message = "Seller has been banned successfully." });
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
        /// Send a warning notification to a seller.
        /// </summary>
        [HttpPost("sellers/{sellerId}/warning")]
        public async Task<IActionResult> SendWarning(
            int sellerId,
            [FromBody] SendWarningDto request)
        {
            try
            {
                await _adminService.SendWarningAsync(sellerId, request);
                return Ok(new { message = "Warning sent successfully." });
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
        /// Update a seller's commission rate.
        /// </summary>
        [HttpPut("sellers/{sellerId}/commission")]
        public async Task<IActionResult> UpdateSellerCommission(
            int sellerId,
            [FromBody] UpdateCommissionDto request)
        {
            try
            {
                await _adminService.UpdateSellerCommissionAsync(sellerId, request.CommissionRate);
                return Ok(new { message = "Commission rate updated successfully." });
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
        /// Get aggregated dashboard statistics for administration.
        /// </summary>
        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _adminService.GetDashboardStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        /// <summary>
        /// Get all transactions (orders) for the admin dashboard.
        /// </summary>
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _adminService.GetTransactionsAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get detailed transaction info for a specific order.
        /// </summary>
        [HttpGet("transactions/{orderId}")]
        public async Task<IActionResult> GetTransactionDetails(int orderId)
        {
            try
            {
                var result = await _adminService.GetTransactionDetailsAsync(orderId);
                if (result == null) return NotFound(new { message = "Transaction not found." });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ── Settings ──────────────────────────────────────────────────────────

        [HttpGet("settings/{key}")]
        public async Task<IActionResult> GetSystemSetting(string key)
        {
            try
            {
                var result = await _adminService.GetSystemSettingAsync(key);
                if (result == null) return NotFound(new { message = "Setting not found." });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("settings/{key}")]
        public async Task<IActionResult> UpdateSystemSetting(string key, [FromBody] UpdateSystemSettingDto request)
        {
            try
            {
                var result = await _adminService.UpdateSystemSettingAsync(key, request.Value);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
