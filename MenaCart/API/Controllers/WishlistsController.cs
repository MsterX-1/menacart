using API.Extensions;
using Application.DTOs.WishlistDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace API.Controllers
{
    /// <summary>
    /// Controller for managing the user's wishlist.
    /// </summary>
    [ApiController]
    [Route("api/wishlists")]
    [Authorize]
    public class WishlistsController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        /// <summary>
        /// Initializes a new instance of the <see cref="WishlistsController"/> class.
        /// </summary>
        public WishlistsController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        /// <summary>
        /// Retrieves the wishlist for the logged-in user.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _wishlistService.GetWishlistAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Adds a product variant to the logged-in user's wishlist.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequestDto dto)
        {
            try
            {
                var userId = User.GetUserId();
                await _wishlistService.AddToWishlistAsync(userId, dto);
                return Ok(new { Message = "Product variant added to wishlist successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Removes a product variant from the logged-in user's wishlist.
        /// </summary>
        [HttpDelete("{variantId}")]
        public async Task<IActionResult> RemoveFromWishlist(int variantId)
        {
            try
            {
                var userId = User.GetUserId();
                await _wishlistService.RemoveFromWishlistAsync(userId, variantId);
                return Ok(new { Message = "Product variant removed from wishlist successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Checks if a product variant is in the logged-in user's wishlist.
        /// </summary>
        [HttpGet("check/{variantId}")]
        public async Task<IActionResult> CheckWishlistStatus(int variantId)
        {
            try
            {
                var userId = User.GetUserId();
                var isInWishlist = await _wishlistService.IsInWishlistAsync(userId, variantId);
                return Ok(new { IsInWishlist = isInWishlist });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
