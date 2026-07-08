using Application.DTOs.CouponDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        /// <summary>
        /// Admin creates a new coupon.
        /// </summary>
        [HttpPost("admin/coupons")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto request)
        {
            try
            {
                var result = await _couponService.CreateCouponAsync(request);
                return CreatedAtAction(nameof(GetCouponByCode), new { code = result.Code }, result);
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
        /// Admin updates an existing coupon.
        /// </summary>
        [HttpPut("admin/coupons/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCoupon(int id, [FromBody] CreateCouponDto request)
        {
            try
            {
                var result = await _couponService.UpdateCouponAsync(id, request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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
        /// Admin deletes a coupon.
        /// </summary>
        [HttpDelete("admin/coupons/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            try
            {
                await _couponService.DeleteCouponAsync(id);
                return NoContent();
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
        /// Admin retrieves all coupon configurations.
        /// </summary>
        [HttpGet("admin/coupons")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllCoupons()
        {
            var result = await _couponService.GetAllCouponsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Customer or buyer retrieves active coupon details by code (checking validity).
        /// </summary>
        [HttpGet("coupons/{code}")]
        public async Task<IActionResult> GetCouponByCode(string code)
        {
            try
            {
                var result = await _couponService.GetCouponByCodeAsync(code);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
