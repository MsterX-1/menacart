using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class AddressRepository : IAddressRepository
    {
        private readonly AppDbContext _context;

        public AddressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Address?> GetByIdAndUserIdAsync(int addressId, string userId)
        {
            return await _context.Addresses
                .FirstOrDefaultAsync(a => a.AddressId == addressId && a.UserId == userId);
        }
    }
}