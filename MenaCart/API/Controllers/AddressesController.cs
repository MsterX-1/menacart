using API.Extensions;
using Application.DTOs.AddressDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/addresses")]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressesController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        /// <summary>
        /// Retrieve all active addresses for the logged-in user.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyAddresses()
        {
            var userId = User.GetUserId();
            var result = await _addressService.GetMyAddressesAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Add a new address to the user's address book.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddAddress([FromBody] CreateAddressDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _addressService.AddAddressAsync(userId, request);
                return CreatedAtAction(nameof(GetMyAddresses), null, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing address.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] UpdateAddressDto request)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _addressService.UpdateAddressAsync(userId, id, request);
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
        /// Soft-delete an address from the user's address book.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            try
            {
                var userId = User.GetUserId();
                await _addressService.DeleteAddressAsync(userId, id);
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
        /// Set a specific address as the default for its address type.
        /// </summary>
        [HttpPatch("{id}/default")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _addressService.SetDefaultAsync(userId, id);
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
