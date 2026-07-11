using Application.DTOs.UserDtos;
using Application.Extentions;
using Application.Interfaces.IServices;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly Application.Interfaces.IUnitOfWork.IUnitOfWork _unitOfWork;

        public UserService(UserManager<User> userManager, Application.Interfaces.IUnitOfWork.IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<GetUserDto>> GetAllUsersAsync()
        {
            var users = await _userManager.Users.ToListAsync();

            if (users == null || !users.Any())
                throw new Exception("No users found.");

            var dtos = new List<GetUserDto>();
            foreach (var user in users)
            {
                var dto = user.ConvertToGetUserDto();
                var roles = await _userManager.GetRolesAsync(user);
                dto.Roles = roles.ToList();
                dtos.Add(dto);
            }

            return dtos;
        }

        public async Task<GetUserDto> GetUserByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                throw new Exception($"User with ID {id} not found.");

            return user.ConvertToGetUserDto();
        }

        public async Task<bool> UpdateUserAsync(UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);

            if (user == null)
                throw new Exception($"User with ID {dto.UserId} not found.");

            // Update allowed fields only
            user.FirstName = dto.FirstName ?? user.FirstName;
            user.LastName = dto.LastName ?? user.LastName;

            // Identity handles validation and persistence
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Failed to update user: {errors}");
            }

            return true;
        }

        public async Task<bool> ChangePasswordAsync(ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);

            if (user == null)
                throw new Exception($"User with ID {dto.UserId} not found.");

            var result = await _userManager.ChangePasswordAsync(
                user,
                dto.OldPassword,
                dto.NewPassword
            );

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Failed to change password: {errors}");
            }

            return true;
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                throw new Exception($"User with ID {userId} not found.");

            // 1. Check if user has orders or products
            var hasHistoricalData = await _unitOfWork.HasOrdersOrProductsAsync(userId);
            if (hasHistoricalData)
            {
                throw new Exception("Cannot delete account because you have historical orders or listed products. Please contact support or delete your products first.");
            }

            // 2. Clear dependent user data to avoid foreign key restrict errors
            await _unitOfWork.ClearUserDataAsync(userId);

            // 3. Delete the user
            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Failed to delete user: {errors}");
            }

            return true;
        }
    }
}

