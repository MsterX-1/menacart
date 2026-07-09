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
            var seller = await _unitOfWork.SellerRepository.GetById(sellerId);
            
            if (seller != null && seller.FreeShippingThreshold.HasValue && subtotal >= seller.FreeShippingThreshold.Value)
            {
                return 0m; // Free shipping
            }

            if (seller != null && seller.BaseShippingCost.HasValue)
            {
                return seller.BaseShippingCost.Value;
            }

            // Read default shipping cost from appsettings (fallback to 50 if not specified)
            var defaultCostStr = _configuration["Shipping:DefaultCost"];
            if (decimal.TryParse(defaultCostStr, out var cost))
            {
                return cost;
            }

            return 50m;
        }
    }
}
