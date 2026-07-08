using Application.Interfaces.IServices;
using Domain.Models;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace Application.Services
{
    public class ShippingService : IShippingService
    {
        private readonly IConfiguration _configuration;

        public ShippingService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task<decimal> CalculateShippingCostAsync(Address address)
        {
            // Read default shipping cost from appsettings (fallback to 50 if not specified)
            var defaultCostStr = _configuration["Shipping:DefaultCost"];
            if (decimal.TryParse(defaultCostStr, out var cost))
            {
                return Task.FromResult(cost);
            }

            return Task.FromResult(50m);
        }
    }
}
