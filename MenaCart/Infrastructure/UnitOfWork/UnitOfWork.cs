using Application.Interfaces.IRepositories;
using Application.Interfaces.IUnitOfWork;
using Infrastructure.Database;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        public IRefreshTokenRepository RefreshTokenRepository { get; }

        public UnitOfWork(AppDbContext context, IRefreshTokenRepository refreshTokenRepository)
        {
            _context = context;
            RefreshTokenRepository = refreshTokenRepository;
        }
        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
