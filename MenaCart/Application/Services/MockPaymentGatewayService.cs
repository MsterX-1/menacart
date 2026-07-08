using Application.DTOs.PaymentDtos;
using Application.Interfaces.IServices;
using Domain.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class MockPaymentGatewayService : IPaymentGatewayService
    {
        private readonly IConfiguration _configuration;

        public MockPaymentGatewayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task<PaymentSessionResponseDto> CreateSessionAsync(Order order)
        {
            var sessionId = $"sess_{order.OrderId}_{Guid.NewGuid():N}";
            var paymentUrl = $"https://mockpay.com/pay/{sessionId}";

            return Task.FromResult(new PaymentSessionResponseDto
            {
                SessionId = sessionId,
                PaymentUrl = paymentUrl
            });
        }

        public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature)
        {
            var secret = _configuration["Payment:WebhookSecret"] ?? "mock_secret_123";
            
            try
            {
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                var computedSig = Convert.ToHexString(hashBytes);
                
                return Task.FromResult(string.Equals(computedSig, signature, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                return Task.FromResult(false);
            }
        }
    }
}
