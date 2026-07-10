using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class SellerShippingRuleRepository : GenaricRepository<SellerShippingRule>, ISellerShippingRuleRepository
    {
        public SellerShippingRuleRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<SellerShippingRule>> GetBySellerIdAsync(int sellerId)
        {
            return await _dbSet
                .Where(r => r.SellerId == sellerId)
                .ToListAsync();
        }

        public async Task<SellerShippingRule?> GetRuleAsync(int sellerId, string city, string country)
        {
            // First try an exact match for city and country
            var rule = await _dbSet
                .FirstOrDefaultAsync(r => r.SellerId == sellerId && r.City == city && r.Country == country);

            if (rule != null)
                return rule;

            // Fallback to a country-wide rule (where City is null or empty, or "*")
            return await _dbSet
                .FirstOrDefaultAsync(r => r.SellerId == sellerId && (string.IsNullOrEmpty(r.City) || r.City == "*") && r.Country == country);
        }
    }
}
