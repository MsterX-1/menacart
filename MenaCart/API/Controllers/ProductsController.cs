using API.Extensions;
using Application.DTOs.ProductDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace API.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IOutputCacheStore _cacheStore;

        public ProductsController(IProductService productService, IOutputCacheStore cacheStore)
        {
            _productService = productService;
            _cacheStore = cacheStore;
        }

        // ── Public ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Browse approved products. Supports search, category, seller filters.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [OutputCache(Duration = 60, Tags = new[] { "products" })]
        public async Task<IActionResult> Browse(
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? sellerId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _productService.BrowseAsync(search, categoryId, sellerId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Get a single product by ID (public).
        /// </summary>
        [HttpGet("{productId}")]
        [AllowAnonymous]
        [OutputCache(Duration = 60, Tags = new[] { "products" })]
        public async Task<IActionResult> GetById(int productId)
        {
            try
            {
                var result = await _productService.GetByIdAsync(productId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ── Seller ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Get all products belonging to the authenticated seller (any status).
        /// </summary>
        [HttpGet("my")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> GetMyProducts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _productService.GetMyProductsAsync(userId, page, pageSize);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Seller creates a new product with at least one variant.
        /// Product starts in Pending status awaiting admin approval.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> Create([FromBody] CreateProductRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _productService.CreateProductAsync(userId, request);
                // Invalidate the "products" cache so the new product is instantly visible upon approval
                await _cacheStore.EvictByTagAsync("products", default);
                return CreatedAtAction(nameof(GetById), new { productId = result.ProductId }, result);
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
        /// Seller updates their own product. Resets to Pending for re-approval.
        /// </summary>
        [HttpPut("{productId}")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> Update(int productId, [FromBody] UpdateProductRequestDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _productService.UpdateProductAsync(userId, productId, request);
                // Invalidate the "products" cache so updates reflect instantly
                await _cacheStore.EvictByTagAsync("products", default);
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

        /// <summary>
        /// Seller deletes their own product.
        /// </summary>
        [HttpDelete("{productId}")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> Delete(int productId)
        {
            try
            {
                var userId = User.GetUserId();
                await _productService.DeleteProductAsync(userId, productId);
                // Invalidate the "products" cache so deleted items disappear instantly
                await _cacheStore.EvictByTagAsync("products", default);
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
        }

        // ── Admin ──────────────────────────────────────────────────────────────

        /// <summary>
        /// Get all products pending approval.
        /// </summary>
        [HttpGet("admin/pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPending(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _productService.GetPendingProductsAsync(page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Admin approves or rejects a product.
        /// </summary>
        [HttpPatch("{productId}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int productId, [FromBody] ApproveProductRequestDto request)
        {
            try
            {
                var result = await _productService.ApproveProductAsync(productId, request);
                // Invalidate the "products" cache so newly approved products show up instantly on the storefront
                await _cacheStore.EvictByTagAsync("products", default);
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
    }
}
