using Application.DTOs.UserDtos;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.IServices
{
    public interface IUserService
    {
        Task<IEnumerable<GetUserDto>> GetAllUsersAsync();
        Task<GetUserDto> GetUserByIdAsync(string id);
        Task<bool> UpdateUserAsync(UpdateUserDto dto);
        Task<bool> ChangePasswordAsync(ChangePasswordDto dto);
        Task<bool> DeleteUserAsync(string userId);
    }
}
