using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface ISellerDocumentRepository : IGenaricRepository<SellerDocument>
    {
        Task<IEnumerable<SellerDocument>> GetBySellerIdAsync(int sellerId);
    }
}
