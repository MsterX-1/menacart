using API.Extensions;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/loyalty")]
    [Authorize]
    public class LoyaltyController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;

        public LoyaltyController(ILoyaltyService loyaltyService)
        {
            _loyaltyService = loyaltyService;
        }

        /// <summary>
        /// Get loyalty point balance and history for the authenticated user.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyLoyalty()
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _loyaltyService.GetLoyaltyDetailsAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
