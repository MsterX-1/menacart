using API.Extensions;
using Application.DTOs.SellerDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/seller/documents")]
    [Authorize]
    public class SellerDocumentsController : ControllerBase
    {
        private readonly ISellerDocumentService _documentService;

        public SellerDocumentsController(ISellerDocumentService documentService)
        {
            _documentService = documentService;
        }

        /// <summary>
        /// Upload a KYC document. Open to users with a pending/active seller profile.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> UploadDocument([FromForm] string documentType, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            try
            {
                var userId = User.GetUserId();

                // Save file to wwwroot/uploads/kyc
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "kyc");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var documentUrl = $"/uploads/kyc/{uniqueFileName}";
                var result = await _documentService.UploadDocumentAsync(userId, documentType, documentUrl);

                return CreatedAtAction(nameof(GetMyDocuments), null, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all KYC documents for the authenticated seller.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyDocuments()
        {
            try
            {
                var userId = User.GetUserId();
                var result = await _documentService.GetMyDocumentsAsync(userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Admin retrieves all documents for a specific seller.
        /// </summary>
        [HttpGet("admin/{sellerId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetSellerDocumentsForAdmin(int sellerId)
        {
            var result = await _documentService.GetSellerDocumentsAsync(sellerId);
            return Ok(result);
        }

        /// <summary>
        /// Admin approves or rejects a KYC document.
        /// </summary>
        [HttpPatch("admin/{documentId}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReviewDocument(int documentId, [FromBody] ReviewSellerDocumentDto request)
        {
            try
            {
                var result = await _documentService.ReviewDocumentAsync(documentId, request);
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
