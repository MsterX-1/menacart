using Application.Interfaces.IRepositories;
using Domain.Models;
using Infrastructure.Database;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repository
{
    public class SellerDocumentRepository : GenaricRepository<SellerDocument>, ISellerDocumentRepository
    {
        public SellerDocumentRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<SellerDocument>> GetBySellerIdAsync(int sellerId)
        {
            return await _dbSet
                .Where(sd => sd.SellerId == sellerId)
                .OrderByDescending(sd => sd.CreatedAt)
                .ToListAsync();
        }
    }
}
