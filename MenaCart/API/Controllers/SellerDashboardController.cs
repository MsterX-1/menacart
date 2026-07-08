using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.Extensions;
using System.Threading.Tasks;
using System;

namespace API.Controllers
{
    [ApiController]
    [Route("api/seller-dashboard")]
    [Authorize(Roles = "Seller")]
    public class SellerDashboardController : ControllerBase
    {
        private readonly ISellerDashboardService _sellerDashboardService;
        private readonly ISellerOnboardingService _sellerOnboardingService;

        public SellerDashboardController(ISellerDashboardService sellerDashboardService, ISellerOnboardingService sellerOnboardingService)
        {
            _sellerDashboardService = sellerDashboardService;
            _sellerOnboardingService = sellerOnboardingService;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var userId = User.GetUserId();
                var profile = await _sellerOnboardingService.GetProfileAsync(userId);
                
                var stats = await _sellerDashboardService.GetSellerDashboardStatsAsync(profile.SellerId);
                return Ok(stats);
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
