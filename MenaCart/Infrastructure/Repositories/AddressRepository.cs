using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class AddressRepository : GenaricRepository<Address>, IAddressRepository
    {
        public AddressRepository(AppDbContext context) : base(context) { }

        public async Task<Address?> GetByIdAndUserIdAsync(int addressId, string userId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(a => a.AddressId == addressId && a.UserId == userId && a.IsActive);
        }

        public async Task<Address?> GetDefaultByUserIdAsync(string userId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault && a.IsActive);
        }

        public async Task<IEnumerable<Address>> GetAllByUserIdAsync(string userId)
        {
            return await _dbSet
                .Where(a => a.UserId == userId && a.IsActive)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task ClearDefaultAsync(string userId, AddressType type)
        {
            var defaults = await _dbSet
                .Where(a => a.UserId == userId && a.IsDefault && a.AddressType == type && a.IsActive)
                .ToListAsync();

            foreach (var a in defaults)
                a.IsDefault = false;
        }
    }
}