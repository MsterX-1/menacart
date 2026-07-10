using Application.DTOs.PaymentDtos;
using Domain.Models;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IPaymentGatewayService
    {
        Task<PaymentSessionResponseDto> CreateSessionAsync(Order order);
        Task<PaymentWebhookDto?> ProcessWebhookAsync(string payload, string signature);
        Task<PaymentWebhookDto?> VerifySessionAsync(string sessionId);
        Task<string> CreateTransferAsync(string destinationAccountId, decimal amount, string description);
    }
}
