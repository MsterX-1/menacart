using Application.DTOs.AddressDtos;

namespace Application.Interfaces.IServices
{
    public interface IAddressService
    {
        Task<IEnumerable<AddressResponseDto>> GetMyAddressesAsync(string userId);
        Task<AddressResponseDto> AddAddressAsync(string userId, CreateAddressDto request);
        Task<AddressResponseDto> UpdateAddressAsync(string userId, int addressId, UpdateAddressDto request);
        Task DeleteAddressAsync(string userId, int addressId);
        Task<AddressResponseDto> SetDefaultAsync(string userId, int addressId);
    }
}