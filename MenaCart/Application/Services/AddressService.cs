using Application.DTOs.AddressDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;

namespace Application.Services
{
    public class AddressService : IAddressService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AddressService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<AddressResponseDto>> GetMyAddressesAsync(string userId)
        {
            var addresses = await _unitOfWork.AddressRepository.GetAllByUserIdAsync(userId);
            return addresses.Select(MapToDto);
        }

        public async Task<AddressResponseDto> AddAddressAsync(string userId, CreateAddressDto request)
        {
            if (!Enum.TryParse<AddressType>(request.AddressType, out var addressType))
                throw new Exception($"Invalid address type '{request.AddressType}'.");

            // If this is set as default, clear existing defaults first
            if (request.IsDefault)
                await _unitOfWork.AddressRepository.ClearDefaultAsync(userId, addressType);

            var address = new Address
            {
                UserId = userId,
                AddressType = addressType,
                Street = request.Street,
                City = request.City,
                State = request.State,
                Country = request.Country,
                ZipCode = request.ZipCode,
                IsDefault = request.IsDefault,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.AddressRepository.Add(address);
            await _unitOfWork.CompleteAsync();

            return MapToDto(address);
        }

        public async Task<AddressResponseDto> UpdateAddressAsync(
            string userId, int addressId, UpdateAddressDto request)
        {
            var address = await _unitOfWork.AddressRepository.GetByIdAndUserIdAsync(addressId, userId);
            if (address == null)
                throw new KeyNotFoundException("Address not found.");

            if (request.AddressType != null)
            {
                if (!Enum.TryParse<AddressType>(request.AddressType, out var addressType))
                    throw new Exception($"Invalid address type '{request.AddressType}'.");
                address.AddressType = addressType;
            }

            if (request.Street != null) address.Street = request.Street;
            if (request.City != null) address.City = request.City;
            if (request.State != null) address.State = request.State;
            if (request.Country != null) address.Country = request.Country;
            if (request.ZipCode != null) address.ZipCode = request.ZipCode;

            if (request.IsDefault.HasValue && request.IsDefault.Value)
            {
                await _unitOfWork.AddressRepository.ClearDefaultAsync(userId, address.AddressType);
                address.IsDefault = true;
            }

            address.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.AddressRepository.Update(address);
            await _unitOfWork.CompleteAsync();

            return MapToDto(address);
        }

        public async Task DeleteAddressAsync(string userId, int addressId)
        {
            var address = await _unitOfWork.AddressRepository.GetByIdAndUserIdAsync(addressId, userId);
            if (address == null)
                throw new KeyNotFoundException("Address not found.");

            address.IsActive = false;
            await _unitOfWork.AddressRepository.Update(address);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<AddressResponseDto> SetDefaultAsync(string userId, int addressId)
        {
            var address = await _unitOfWork.AddressRepository.GetByIdAndUserIdAsync(addressId, userId);
            if (address == null)
                throw new KeyNotFoundException("Address not found.");

            await _unitOfWork.AddressRepository.ClearDefaultAsync(userId, address.AddressType);
            address.IsDefault = true;
            address.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.AddressRepository.Update(address);
            await _unitOfWork.CompleteAsync();

            return MapToDto(address);
        }

        private static AddressResponseDto MapToDto(Address a) => new()
        {
            AddressId = a.AddressId,
            AddressType = a.AddressType.ToString(),
            Street = a.Street,
            City = a.City,
            State = a.State,
            Country = a.Country,
            ZipCode = a.ZipCode,
            IsDefault = a.IsDefault
        };
    }
}