using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repository
{
    public class SellerPayoutRepository : GenaricRepository<SellerPayout>, ISellerPayoutRepository
    {
        public SellerPayoutRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<SellerPayout>> GetBySellerIdAsync(int sellerId)
        {
            return await _dbSet
                .Where(sp => sp.SellerId == sellerId)
                .OrderByDescending(sp => sp.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SellerPayout>> GetAllPayoutsAsync(string? statusFilter)
        {
            var query = _dbSet.Include(sp => sp.SellerProfile).AsQueryable();
            
            if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<SellerPayoutStatus>(statusFilter, ignoreCase: true, out var status))
            {
                query = query.Where(sp => sp.Status == status);
            }

            return await query
                .OrderByDescending(sp => sp.CreatedAt)
                .ToListAsync();
        }
    }
}
