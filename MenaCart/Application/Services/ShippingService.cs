using Application.Interfaces.IServices;
using Domain.Models;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace Application.Services
{
    public class ShippingService : IShippingService
    {
        private readonly IConfiguration _configuration;
        private readonly Application.Interfaces.IUnitOfWork.IUnitOfWork _unitOfWork;

        public ShippingService(IConfiguration configuration, Application.Interfaces.IUnitOfWork.IUnitOfWork unitOfWork)
        {
            _configuration = configuration;
            _unitOfWork = unitOfWork;
        }

        public async Task<decimal> CalculateShippingCostAsync(Address address, int sellerId, decimal subtotal)
        {
            var rule = await _unitOfWork.SellerShippingRuleRepository.GetRuleAsync(sellerId, address.City, address.Country);

            if (rule == null)
            {
                throw new Exception($"Seller does not deliver to this location ({address.City}, {address.Country}). Please remove their items from your cart.");
            }

            if (rule.FreeShippingAbove.HasValue && subtotal >= rule.FreeShippingAbove.Value)
            {
                return 0m;
            }

            return rule.ShippingCost;
        }
    }
}
