using Application.DTOs.PaymentDtos;
using Domain.Models;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IPaymentGatewayService
    {
        Task<PaymentSessionResponseDto> CreateSessionAsync(Order order);
        Task<bool> VerifyWebhookSignatureAsync(string payload, string signature);
    }
}
