using Domain.Models;

namespace Application.Interfaces.IRepositories
{
    public interface IAddressRepository
    {
        /// <summary>
        /// Returns the address only if it belongs to the given user.
        /// Returns null if not found or ownership mismatch.
        /// </summary>
        Task<Address?> GetByIdAndUserIdAsync(int addressId, string userId);
    }
}