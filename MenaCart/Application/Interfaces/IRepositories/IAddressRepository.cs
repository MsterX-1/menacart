using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IAddressRepository : IGenaricRepository<Address>
    {
        Task<Address?> GetByIdAndUserIdAsync(int addressId, string userId);
        Task<Address?> GetDefaultByUserIdAsync(string userId);
        Task<IEnumerable<Address>> GetAllByUserIdAsync(string userId);
        Task ClearDefaultAsync(string userId);
    }
}