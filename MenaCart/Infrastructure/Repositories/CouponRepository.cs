using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class CouponRepository : GenaricRepository<Coupon>, ICouponRepository
    {

        public CouponRepository(AppDbContext context) : base(context)
        {
        }
        public async Task<Coupon?> GetByCodeAsync(string code)
        {
            return await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == code);
        }

        public async Task<bool> HasUserUsedCouponAsync(string userId, int couponId)
        {
            return await _context.UserCouponUsages
                .AnyAsync(u => u.UserId == userId && u.CouponId == couponId);
        }

        public async Task AddUsageAsync(UserCouponUsage usage)
        {
            await _context.UserCouponUsages.AddAsync(usage);
        }
    }
}