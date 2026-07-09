using Application.DTOs.PaymentDtos;
using Application.Interfaces.IServices;
using Domain.Models;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class StripePaymentGatewayService : IPaymentGatewayService
    {
        private readonly IConfiguration _configuration;

        public StripePaymentGatewayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private RequestOptions GetRequestOptions()
        {
            var secretKey = _configuration["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("Stripe Secret Key is not configured.");
            }
            return new RequestOptions
            {
                ApiKey = secretKey
            };
        }

        public async Task<PaymentSessionResponseDto> CreateSessionAsync(Order order)
        {
            var successUrl = _configuration["Stripe:SuccessUrl"] ?? "http://localhost:5173/payment/processing/{orderId}?session_id={CHECKOUT_SESSION_ID}";
            var cancelUrl = _configuration["Stripe:CancelUrl"] ?? "http://localhost:5173/payment/cancelled?orderId={orderId}";

            // Replace dynamic placeholders
            successUrl = successUrl.Replace("{orderId}", order.OrderId.ToString());
            cancelUrl = cancelUrl.Replace("{orderId}", order.OrderId.ToString());

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(order.TotalAmount * 100), // Stripe expects cents
                            Currency = "egp",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"MenaCart Order #{order.OrderId}",
                                Description = $"Fashion Order with {order.SubOrders?.Count ?? 1} sub-order(s)"
                            }
                        },
                        Quantity = 1
                    }
                },
                Mode = "payment",
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Metadata = new Dictionary<string, string>
                {
                    { "OrderId", order.OrderId.ToString() }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options, GetRequestOptions());

            return new PaymentSessionResponseDto
            {
                SessionId = session.Id,
                PaymentUrl = session.Url
            };
        }

        public Task<PaymentWebhookDto?> ProcessWebhookAsync(string payload, string signature)
        {
            var webhookSecret = _configuration["Stripe:WebhookSecret"];
            if (string.IsNullOrEmpty(webhookSecret))
            {
                throw new InvalidOperationException("Stripe Webhook Secret is not configured.");
            }

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(payload, signature, webhookSecret);

                if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session != null && session.Metadata.TryGetValue("OrderId", out var orderIdStr) && int.TryParse(orderIdStr, out var orderId))
                    {
                        return Task.FromResult<PaymentWebhookDto?>(new PaymentWebhookDto
                        {
                            OrderId = orderId,
                            SessionId = session.Id,
                            TransactionId = session.PaymentIntentId ?? session.Id,
                            Amount = (decimal)(session.AmountTotal ?? 0) / 100m,
                            Status = "Succeeded"
                        });
                    }
                }
                else if (stripeEvent.Type == EventTypes.CheckoutSessionAsyncPaymentFailed)
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session != null && session.Metadata.TryGetValue("OrderId", out var orderIdStr) && int.TryParse(orderIdStr, out var orderId))
                    {
                        return Task.FromResult<PaymentWebhookDto?>(new PaymentWebhookDto
                        {
                            OrderId = orderId,
                            SessionId = session.Id,
                            TransactionId = session.PaymentIntentId ?? session.Id,
                            Amount = (decimal)(session.AmountTotal ?? 0) / 100m,
                            Status = "Failed"
                        });
                    }
                }

                return Task.FromResult<PaymentWebhookDto?>(null);
            }
            catch (StripeException ex)
            {
                throw new UnauthorizedAccessException("Stripe signature verification failed.", ex);
            }
        }

        public async Task<PaymentWebhookDto?> VerifySessionAsync(string sessionId)
        {
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
            var service = new SessionService();
            var session = await service.GetAsync(sessionId);

            if (session.PaymentStatus != "paid") return null;

            return new PaymentWebhookDto
            {
                OrderId = int.Parse(session.Metadata["OrderId"]),
                Status = "Succeeded",
                Amount = session.AmountTotal.HasValue ? session.AmountTotal.Value / 100m : 0,
                TransactionId = session.PaymentIntentId ?? session.Id
            };
        }

        public async Task<string> CreateTransferAsync(string destinationAccountId, decimal amount, string description)
        {
            var options = new TransferCreateOptions
            {
                Amount = (long)(amount * 100), // convert to cents
                Currency = "egp",
                Destination = destinationAccountId,
                Description = description
            };

            var service = new TransferService();
            var transfer = await service.CreateAsync(options, GetRequestOptions());
            return transfer.Id;
        }
    }
}
