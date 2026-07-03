using Domain.Security;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.IRepositories
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken?> GetRefreshTokenByTokenAsync(string token);

        Task<IEnumerable<RefreshToken>> GetRefreshTokensByUserIdAsync(string userId);

        Task AddAsync(RefreshToken refreshToken);

        Task RevokeRefreshTokenAsync(string token);

        Task RevokeAllUserRefreshTokensAsync(string userId);
    }
}
