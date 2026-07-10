using Application.DTOs.PaymentDtos;
using Application.Interfaces.IServices;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/payment/webhook")]
    public class WebhookController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public WebhookController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        public async Task<IActionResult> HandlePaymentWebhook()
        {
            string? signature = null;
            if (Request.Headers.TryGetValue("Stripe-Signature", out var stripeSig))
            {
                signature = stripeSig.ToString();
            }
            else if (Request.Headers.TryGetValue("X-Payment-Signature", out var xSig))
            {
                signature = xSig.ToString();
            }

            if (string.IsNullOrEmpty(signature))
            {
                return BadRequest(new { message = "Missing signature header." });
            }

            string rawBody;
            using (var reader = new StreamReader(Request.Body))
            {
                rawBody = await reader.ReadToEndAsync();
            }

            try
            {
                await _orderService.ProcessPaymentWebhookAsync(rawBody, signature);
                return Ok(new { message = "Webhook processed successfully." });
            }
            catch (System.UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
