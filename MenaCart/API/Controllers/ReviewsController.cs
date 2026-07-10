using API.Extensions;
using Application.DTOs.ReviewDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        /// <summary>
        /// Submit a new product review (buyer only, must have purchased product).
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SubmitProductReview([FromBody] CreateReviewDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _reviewService.SubmitProductReviewAsync(userId, request);
                return CreatedAtAction(nameof(GetProductReviews), new { productId = result.ProductId }, result);
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
        /// Get product reviews (public, paginated).
        /// </summary>
        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductReviews(int productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _reviewService.GetProductReviewsAsync(productId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Submit a new seller review (buyer only, must have purchased from seller).
        /// </summary>
        [HttpPost("seller")]
        [Authorize]
        public async Task<IActionResult> SubmitSellerReview([FromBody] CreateSellerReviewDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _reviewService.SubmitSellerReviewAsync(userId, request);
                return Ok(result);
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
        /// Get seller reviews (public, paginated).
        /// </summary>
        [HttpGet("seller/{sellerId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSellerReviews(int sellerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _reviewService.GetSellerReviewsAsync(sellerId, page, pageSize);
            return Ok(result);
        }
    }
}
