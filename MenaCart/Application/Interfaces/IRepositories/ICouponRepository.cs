using Domain.Models;


namespace Application.Interfaces.IRepositories
{
    public interface ICouponRepository : IGenaricRepository<Coupon>
    {
        public  Task<Coupon?> GetByCodeAsync(string code);
        public  Task<bool> HasUserUsedCouponAsync(string userId, int couponId);
        public  Task AddUsageAsync(UserCouponUsage usage);
    }
}
