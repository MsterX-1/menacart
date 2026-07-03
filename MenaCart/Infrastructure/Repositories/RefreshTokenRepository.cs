using Application.Interfaces.IRepositories;
using Domain.Models;
using Domain.Security;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly AppDbContext _context;

        public RefreshTokenRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RefreshToken?> GetRefreshTokenByTokenAsync(string token)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == token);
        }

        public async Task<IEnumerable<RefreshToken>> GetRefreshTokensByUserIdAsync(string userId)
        {
            return await _context.RefreshTokens
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Expires)
                .ToListAsync();
        }

        public async Task RevokeAllUserRefreshTokensAsync(string userId)
        {
            var tokens = await _context.RefreshTokens
                .Where(x => x.UserId == userId
                         && x.Revoked == null
                         && x.Expires > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.Revoked = DateTime.UtcNow;
            }
        }

        public async Task AddAsync(RefreshToken refreshToken)
        {
            await _context.RefreshTokens.AddAsync(refreshToken);
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            var existingToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == token
                                       && x.Revoked == null
                                       && x.Expires > DateTime.UtcNow);

            if (existingToken != null)
            {
                existingToken.Revoked = DateTime.UtcNow;
            }
        }
    }
}