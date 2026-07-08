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
            if (!Request.Headers.TryGetValue("X-Payment-Signature", out var signatureHeader))
            {
                return BadRequest(new { message = "Missing X-Payment-Signature header." });
            }

            string rawBody;
            using (var reader = new StreamReader(Request.Body))
            {
                rawBody = await reader.ReadToEndAsync();
            }

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var webhookData = JsonSerializer.Deserialize<PaymentWebhookDto>(rawBody, options);

                if (webhookData == null)
                    return BadRequest(new { message = "Invalid JSON payload." });

                await _orderService.ProcessPaymentWebhookAsync(webhookData, rawBody, signatureHeader.ToString());
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
